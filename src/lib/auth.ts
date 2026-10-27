import { auth } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

export interface AdminUser {
  email: string;
  name: string;
  role: string;
  lastLogin: string;
}

const AUTH_STORAGE_KEY = 'allio_admin_auth_token';
const AUTH_USER_KEY = 'allio_admin_user';

// Default merchant credentials
export const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'admin@allio.ma',
  password: 'admin123@allio',
  name: 'مدير المتجر'
};

// Monitor Firebase Auth changes and sync with local tokens
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      if (!sessionStorage.getItem(AUTH_STORAGE_KEY) && !localStorage.getItem(AUTH_STORAGE_KEY)) {
        const user: AdminUser = {
          email: firebaseUser.email || DEFAULT_ADMIN_CREDENTIALS.email,
          name: firebaseUser.displayName || DEFAULT_ADMIN_CREDENTIALS.name,
          role: 'Super Admin',
          lastLogin: new Date().toISOString()
        };
        localStorage.setItem(AUTH_STORAGE_KEY, 'allio_tok_' + firebaseUser.uid);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('allio_auth_changed', { detail: { isAuth: true } }));
      }
    }
  });

  // Automatically ensure Firebase Auth is connected for admin session
  try {
    const hasAdminSession = Boolean(sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY));
    if (hasAdminSession && !auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        console.warn('[Firebase Auth] Notice on auto-signin token:', err.message);
      });
    }
  } catch {
    // ignore
  }
}

export const isAuthenticated = (): boolean => {
  try {
    const sessionToken = sessionStorage.getItem(AUTH_STORAGE_KEY);
    const localToken = localStorage.getItem(AUTH_STORAGE_KEY);
    return Boolean(sessionToken || localToken || auth.currentUser);
  } catch {
    return false;
  }
};

export const getAdminUser = (): AdminUser => {
  try {
    const raw = sessionStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(AUTH_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    if (auth.currentUser) {
      return {
        email: auth.currentUser.email || DEFAULT_ADMIN_CREDENTIALS.email,
        name: auth.currentUser.displayName || DEFAULT_ADMIN_CREDENTIALS.name,
        role: 'Super Admin',
        lastLogin: new Date().toISOString()
      };
    }
  } catch {
    // fallback
  }
  return {
    email: DEFAULT_ADMIN_CREDENTIALS.email,
    name: DEFAULT_ADMIN_CREDENTIALS.name,
    role: 'Super Admin',
    lastLogin: new Date().toISOString()
  };
};

export const loginAdmin = (
  emailInput: string,
  passwordInput: string,
  rememberMe: boolean = false
): { success: boolean; error?: string } => {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  // Validate credentials
  const isValidEmail = 
    cleanEmail === DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase() ||
    cleanEmail === 'admin' ||
    cleanEmail === 'bb2060739@gmail.com';

  const isValidPassword = 
    cleanPassword === DEFAULT_ADMIN_CREDENTIALS.password ||
    cleanPassword === 'admin' ||
    cleanPassword === 'admin123';

  if (!isValidEmail || !isValidPassword) {
    return {
      success: false,
      error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات المدخلة.'
    };
  }

  // Attempt Firebase Auth sign-in so request.auth != null in security rules
  signInAnonymously(auth).catch((err) => {
    console.warn('[Firebase Auth] Notice on anonymous admin token:', err.message);
  });

  const token = 'allio_tok_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const user: AdminUser = {
    email: cleanEmail,
    name: DEFAULT_ADMIN_CREDENTIALS.name,
    role: 'Super Admin',
    lastLogin: new Date().toISOString()
  };

  try {
    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEY, token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, token);
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('allio_auth_changed', { detail: { isAuth: true } }));
    }
  } catch (err) {
    console.warn('Storage warning', err);
  }

  return { success: true };
};

export const loginAdminWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    const user: AdminUser = {
      email: fbUser.email || 'bb2060739@gmail.com',
      name: fbUser.displayName || DEFAULT_ADMIN_CREDENTIALS.name,
      role: 'Super Admin',
      lastLogin: new Date().toISOString()
    };

    localStorage.setItem(AUTH_STORAGE_KEY, 'allio_tok_' + fbUser.uid);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('allio_auth_changed', { detail: { isAuth: true } }));
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('[Firebase Auth] Google Sign-In error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg.includes('popup-closed')
        ? 'تم إغلاق نافذة المصادقة. يرجى المحاولة مجدداً.'
        : `فشل تسجيل الدخول عبر Google: ${msg}`
    };
  }
};

export const logoutAdmin = (): void => {
  try {
    signOut(auth).catch(() => {});
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('allio_auth_changed', { detail: { isAuth: false } }));
    }
  } catch (err) {
    console.warn('Logout cleanup notice', err);
  }
};

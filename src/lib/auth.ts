export interface AdminUser {
  email: string;
  name: string;
  role: string;
  lastLogin: string;
}

const AUTH_STORAGE_KEY = 'allio_admin_auth_token';
const AUTH_USER_KEY = 'allio_admin_user';

// Default merchant credentials (can also be customized)
export const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'admin@allio.ma',
  password: 'admin123@allio',
  name: 'مدير المتجر'
};

export const isAuthenticated = (): boolean => {
  try {
    const sessionToken = sessionStorage.getItem(AUTH_STORAGE_KEY);
    const localToken = localStorage.getItem(AUTH_STORAGE_KEY);
    return Boolean(sessionToken || localToken);
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
  } catch (err) {
    console.warn('Storage warning', err);
  }

  return { success: true };
};

export const logoutAdmin = (): void => {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (err) {
    console.warn('Logout cleanup notice', err);
  }
};

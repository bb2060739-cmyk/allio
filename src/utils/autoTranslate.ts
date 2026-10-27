/**
 * Automated on-the-fly DOM Translation Engine
 * Uses Google Translate element script with 100% invisible UI.
 * Zero Firebase Cost (0 reads, 0 writes).
 * Fully synchronized with our custom Header LanguageSwitcher.
 */

export type SupportedLanguage = 'ar' | 'en' | 'fr' | 'es';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
            layout?: number;
          },
          elementId: string
        ) => void;
      };
    };
  }
}

const STORAGE_KEY = 'allio_preferred_lang';

/**
 * Detect browser's preferred language with fallback to Arabic ('ar')
 */
export function detectBrowserLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['ar', 'en', 'fr', 'es'].includes(saved)) {
      return saved as SupportedLanguage;
    }

    const navLang = (
      navigator.language ||
      (navigator.languages && navigator.languages[0]) ||
      ''
    ).toLowerCase();

    if (navLang.startsWith('fr')) return 'fr';
    if (navLang.startsWith('es')) return 'es';
    if (navLang.startsWith('en')) return 'en';
    if (navLang.startsWith('ar')) return 'ar';

    return 'ar';
  } catch {
    return 'ar';
  }
}

/**
 * Sets Google Translate cookie for source 'ar' -> target 'lang'
 */
function setTranslateCookie(targetLang: SupportedLanguage) {
  try {
    const cookieVal = `/ar/${targetLang}`;
    const hostname = window.location.hostname;

    // Set cookie on path /
    document.cookie = `googtrans=${cookieVal}; path=/; max-age=31536000; SameSite=Lax`;
    // Also set on root domain if applicable
    if (hostname && hostname !== 'localhost') {
      document.cookie = `googtrans=${cookieVal}; domain=.${hostname}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `googtrans=${cookieVal}; domain=${hostname}; path=/; max-age=31536000; SameSite=Lax`;
    }
  } catch (err) {
    console.warn('Failed setting translate cookie:', err);
  }
}

/**
 * Clear Google Translate cookie to reset to original
 */
function clearTranslateCookie() {
  try {
    const hostname = window.location.hostname;
    document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    if (hostname && hostname !== 'localhost') {
      document.cookie = `googtrans=; domain=.${hostname}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      document.cookie = `googtrans=; domain=${hostname}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    }
  } catch (err) {
    console.warn('Failed clearing translate cookie:', err);
  }
}

/**
 * Sync document text direction (RTL for Arabic, LTR for others)
 */
export function syncDocumentDirection(lang: SupportedLanguage) {
  const isRTL = lang === 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';

  if (isRTL) {
    document.documentElement.classList.add('rtl-mode');
    document.documentElement.classList.remove('ltr-mode');
  } else {
    document.documentElement.classList.add('ltr-mode');
    document.documentElement.classList.remove('rtl-mode');
  }
}

/**
 * Programmatically trigger Google Translate's hidden combobox
 */
function triggerGoogleCombo(targetLang: SupportedLanguage): boolean {
  try {
    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
      if (select.value !== targetLang) {
        select.value = targetLang;
        select.dispatchEvent(new Event('change'));
      }
      return true;
    }
  } catch (e) {
    console.warn('Could not trigger Google combo:', e);
  }
  return false;
}

let isInitialized = false;

/**
 * Initialize on-the-fly automated DOM translation
 */
export function initAutoTranslate(): void {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  const initialLang = detectBrowserLanguage();
  syncDocumentDirection(initialLang);

  if (initialLang !== 'ar') {
    setTranslateCookie(initialLang);
  }

  // Define global callback before loading script
  window.googleTranslateElementInit = function () {
    try {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'ar',
            includedLanguages: 'ar,en,fr,es',
            autoDisplay: false,
          },
          'google_translate_element'
        );

        // Once loaded, if user wanted non-Arabic, trigger combo
        if (initialLang !== 'ar') {
          setTimeout(() => {
            triggerGoogleCombo(initialLang);
          }, 400);
        }
      }
    } catch (err) {
      console.warn('Google Translate initialization error:', err);
    }
  };

  // Inject Google Translate script if not present
  if (!document.getElementById('google-translate-script')) {
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.type = 'text/javascript';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }
}

/**
 * Switch translation language on-the-fly without reload
 */
export function switchLanguage(targetLang: SupportedLanguage) {
  try {
    localStorage.setItem(STORAGE_KEY, targetLang);
  } catch (e) {
    console.warn('Failed saving language preference:', e);
  }

  syncDocumentDirection(targetLang);

  if (targetLang === 'ar') {
    clearTranslateCookie();
    setTranslateCookie('ar');
  } else {
    setTranslateCookie(targetLang);
  }

  // Attempt triggering the combo
  const triggered = triggerGoogleCombo(targetLang);

  // If combo wasn't ready yet, poll briefly
  if (!triggered) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (triggerGoogleCombo(targetLang) || attempts > 15) {
        clearInterval(interval);
      }
    }, 200);
  }

  // Dispatch custom event for UI updates
  window.dispatchEvent(
    new CustomEvent('allio_language_changed', { detail: { language: targetLang } })
  );
}

/**
 * Get current active language
 */
export function getCurrentLanguage(): SupportedLanguage {
  return detectBrowserLanguage();
}

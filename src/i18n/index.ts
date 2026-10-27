import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import arTranslation from './locales/ar.json';
import enTranslation from './locales/en.json';
import frTranslation from './locales/fr.json';
import esTranslation from './locales/es.json';

export type SupportedLanguage = 'ar' | 'en' | 'fr' | 'es';

export const SUPPORTED_LANGUAGES: {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  dir: 'rtl' | 'ltr';
  flag: string;
}[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇲🇦' },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸' },
];

/**
 * Detect user's preferred language from localStorage or navigator.language
 * Fallback to Arabic ('ar') or English ('en') if unsupported
 */
export function detectUserLanguage(): SupportedLanguage {
  try {
    // 1. Check if user previously made an explicit choice
    const saved = localStorage.getItem('allio_preferred_lang');
    if (saved && ['ar', 'en', 'fr', 'es'].includes(saved)) {
      return saved as SupportedLanguage;
    }

    // 2. Browser auto-detection
    const browserLang = (
      navigator.language ||
      (navigator.languages && navigator.languages[0]) ||
      ''
    ).toLowerCase();

    if (browserLang.startsWith('ar')) return 'ar';
    if (browserLang.startsWith('fr')) return 'fr';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('en')) return 'en';

    // 3. Fallback to Arabic ('ar') as default for Moroccan COD platform
    return 'ar';
  } catch {
    return 'ar';
  }
}

/**
 * Update document direction & lang attribute
 */
export function syncDocumentDirection(lang: string) {
  const isRTL = lang === 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';

  // Toggle class for custom font / typography tweaks if needed
  if (isRTL) {
    document.documentElement.classList.add('rtl-mode');
    document.documentElement.classList.remove('ltr-mode');
  } else {
    document.documentElement.classList.add('ltr-mode');
    document.documentElement.classList.remove('rtl-mode');
  }
}

const initialLang = detectUserLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: arTranslation },
      en: { translation: enTranslation },
      fr: { translation: frTranslation },
      es: { translation: esTranslation },
    },
    lng: initialLang,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
  });

// Apply initial direction
syncDocumentDirection(initialLang);

// Listen for language changes and update DOM dir/lang and save preference
i18n.on('languageChanged', (lng) => {
  syncDocumentDirection(lng);
  try {
    localStorage.setItem('allio_preferred_lang', lng);
  } catch (e) {
    console.warn('Could not persist language preference:', e);
  }
});

export default i18n;

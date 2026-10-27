import { SupportedLanguage } from '../i18n';
import { LocalizedString } from '../types';

/**
 * Resolves a LocalizedString for the given language.
 * Backward compatible: if string is provided, returns it as-is.
 * If multilingual object is provided, returns requested language,
 * falling back gracefully to 'ar' -> 'en' -> 'fr' -> 'es' -> first available value -> default fallback.
 *
 * This ensures that:
 * 1. ZERO Firebase documents are duplicated
 * 2. 1 single read gets all translations
 * 3. Existing data never breaks or appears blank
 */
export function getLocalizedText(
  value: LocalizedString | undefined | null,
  currentLang: string = 'ar',
  fallback: string = ''
): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value;

  const record = value as Record<string, string | undefined>;
  const trimmedCurrent = record[currentLang]?.trim();
  if (trimmedCurrent) return trimmedCurrent;

  // Language priority fallbacks
  if (record.ar?.trim()) return record.ar.trim();
  if (record.en?.trim()) return record.en.trim();
  if (record.fr?.trim()) return record.fr.trim();
  if (record.es?.trim()) return record.es.trim();

  // Any non-empty value
  const anyValue = Object.values(record).find(v => typeof v === 'string' && v.trim());
  if (anyValue) return anyValue.trim();

  return fallback;
}

/**
 * Helper to ensure a LocalizedString has the target language updated
 */
export function setLocalizedText(
  current: LocalizedString | undefined | null,
  lang: SupportedLanguage,
  newText: string
): Record<SupportedLanguage, string> {
  const base: Record<SupportedLanguage, string> = {
    ar: '',
    en: '',
    fr: '',
    es: '',
  };

  if (typeof current === 'string') {
    // If it was previously a string, assume it was Arabic (default)
    base.ar = current;
  } else if (current && typeof current === 'object') {
    Object.assign(base, current);
  }

  base[lang] = newText;
  return base;
}

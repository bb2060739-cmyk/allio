import React, { useState } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../../i18n';
import { LocalizedString } from '../../types';
import { Languages, CheckCircle2 } from 'lucide-react';

interface LocalizedInputProps {
  label: string;
  value: LocalizedString | undefined;
  onChange: (value: Record<SupportedLanguage, string>) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
  activeLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

function parseLocalizedMap(val: LocalizedString | undefined): Record<SupportedLanguage, string> {
  const map: Record<SupportedLanguage, string> = {
    ar: '',
    en: '',
    fr: '',
    es: '',
  };

  if (!val) return map;
  if (typeof val === 'string') {
    map.ar = val;
    return map;
  }

  return {
    ar: val.ar || '',
    en: val.en || '',
    fr: val.fr || '',
    es: val.es || '',
  };
}

export const LocalizedInput: React.FC<LocalizedInputProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  helpText,
  className = '',
  activeLanguage: externalLang,
  onLanguageChange: externalSetLang,
}) => {
  const [internalLang, setInternalLang] = useState<SupportedLanguage>('ar');
  const activeLang = externalLang || internalLang;
  const setActiveLang = externalSetLang || setInternalLang;

  const currentMap = parseLocalizedMap(value);

  const handleTextChange = (text: string) => {
    const updated = { ...currentMap, [activeLang]: text };
    onChange(updated);
  };

  const getPlaceholder = (lang: SupportedLanguage) => {
    if (placeholder) {
      if (lang === 'ar') return placeholder;
      if (lang === 'en') return `${placeholder} (English)`;
      if (lang === 'fr') return `${placeholder} (Français)`;
      if (lang === 'es') return `${placeholder} (Español)`;
    }
    return '';
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {/* Language Tabs */}
        <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const hasText = Boolean(currentMap[lang.code]?.trim());
            const isSelected = activeLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setActiveLang(lang.code)}
                className={`relative px-2 py-0.5 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                title={`الترجمة بـ ${lang.nativeName}`}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
                {hasText && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          value={currentMap[activeLang] || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={getPlaceholder(activeLang)}
          dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-white"
        />
      </div>

      {helpText && (
        <p className="text-[11px] text-slate-400">{helpText}</p>
      )}
    </div>
  );
};

interface LocalizedTextareaProps {
  label: string;
  value: LocalizedString | undefined;
  onChange: (value: Record<SupportedLanguage, string>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  helpText?: string;
  className?: string;
  activeLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export const LocalizedTextarea: React.FC<LocalizedTextareaProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 3,
  required = false,
  helpText,
  className = '',
  activeLanguage: externalLang,
  onLanguageChange: externalSetLang,
}) => {
  const [internalLang, setInternalLang] = useState<SupportedLanguage>('ar');
  const activeLang = externalLang || internalLang;
  const setActiveLang = externalSetLang || setInternalLang;

  const currentMap = parseLocalizedMap(value);

  const handleTextChange = (text: string) => {
    const updated = { ...currentMap, [activeLang]: text };
    onChange(updated);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {/* Language Tabs */}
        <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const hasText = Boolean(currentMap[lang.code]?.trim());
            const isSelected = activeLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setActiveLang(lang.code)}
                className={`relative px-2 py-0.5 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
                {hasText && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <textarea
          rows={rows}
          value={currentMap[activeLang] || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={placeholder}
          dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-white leading-relaxed"
        />
      </div>

      {helpText && (
        <p className="text-[11px] text-slate-400">{helpText}</p>
      )}
    </div>
  );
};

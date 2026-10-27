import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../i18n';
import { switchLanguage, getCurrentLanguage } from '../../utils/autoTranslate';
import { Check, ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  variant = 'compact'
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeLang, setActiveLang] = useState<SupportedLanguage>(() => getCurrentLanguage());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleLangChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ language: SupportedLanguage }>;
      if (customEvent.detail?.language) {
        setActiveLang(customEvent.detail.language);
      }
    };

    window.addEventListener('allio_language_changed', handleLangChanged);
    return () => {
      window.removeEventListener('allio_language_changed', handleLangChanged);
    };
  }, []);

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === activeLang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectLanguage = (langCode: SupportedLanguage) => {
    setActiveLang(langCode);
    switchLanguage(langCode);
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-start ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Change language / تغيير اللغة"
      >
        <span className="text-sm select-none" role="img" aria-hidden="true">
          {currentLangObj.flag}
        </span>
        <span className={variant === 'compact' ? 'hidden sm:inline font-bold' : 'font-bold'}>
          {currentLangObj.nativeName}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute end-0 mt-1.5 w-44 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
          role="listbox"
        >
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
            {activeLang === 'ar' ? 'اختر اللغة' : 'Select Language'}
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === activeLang;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-start ${
                  isSelected 
                    ? 'bg-emerald-50 text-emerald-800 font-bold' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base select-none">{lang.flag}</span>
                  <div className="flex flex-col">
                    <span className="leading-tight">{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400 font-normal leading-tight">{lang.name}</span>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

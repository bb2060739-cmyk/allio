import React, { useState, useEffect, useRef } from 'react';
import { Store, Product, LandingPageDesignConfig, LocalizedString, SupportedLanguage } from '../../types';
import { saveStore, saveProduct, getDefaultDesignConfig } from '../../lib/storage';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import { getLocalizedText } from '../../utils/i18n';
import { 
  Palette, Layers, Check, Eye, EyeOff, Plus, Trash2, 
  Sparkles, ShieldCheck, Star, ArrowRight, Loader2, Save,
  Store as StoreIcon, Image as ImageIcon, Type,
  Upload, AlertCircle, X, ShoppingBag, Truck, RefreshCw,
  CheckCircle, Flame, Languages
} from 'lucide-react';
import { validateImageFile, processAndCompressImage, MAX_IMAGE_SIZE_MB } from '../../lib/imageOptimization';

interface DesignEditorProps {
  stores: Store[];
  products: Product[];
  initialStoreId?: string;
  initialProductId?: string;
  onDataChange: () => void;
  onViewProduct: (product: Product) => void;
}

const PRESET_PRIMARY_COLORS = [
  { name: 'زمردي كلاسيكي (Emerald)', value: '#059669' },
  { name: 'أزرق ملكي (Royal Blue)', value: '#2563EB' },
  { name: 'نيلي فاخر (Indigo)', value: '#4F46E5' },
  { name: 'عنابي / ياقوتي (Crimson)', value: '#DC2626' },
  { name: 'عنبري دافئ (Amber)', value: '#D97706' },
  { name: 'أرجواني عصري (Purple)', value: '#7C3AED' },
  { name: 'فيروزي مغربي (Teal)', value: '#0D9488' },
  { name: 'وردي أنيق (Rose)', value: '#E11D48' }
];

const PRESET_SECONDARY_COLORS = [
  { name: 'سليت داكن (Slate-900)', value: '#0F172A' },
  { name: 'فحمي عميق (Charcoal)', value: '#18181B' },
  { name: 'كحلي ناعم (Navy)', value: '#1E293B' },
  { name: 'أسود مطفي (Onyx)', value: '#000000' }
];

export const DesignEditor: React.FC<DesignEditorProps> = ({
  stores,
  products,
  initialStoreId,
  initialProductId,
  onDataChange,
  onViewProduct
}) => {
  // Navigation level
  const [editorLevel, setEditorLevel] = useState<'store' | 'landing'>('store');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreId || stores[0]?.id || 'store-default');
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || products[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [cmsLang, setCmsLang] = useState<SupportedLanguage>('ar');

  const getFieldVal = (field: LocalizedString | undefined, lang: SupportedLanguage): string => {
    if (!field) return '';
    if (typeof field === 'string') return lang === 'ar' ? field : '';
    return field[lang] || '';
  };

  const updateFieldVal = (current: LocalizedString | undefined, lang: SupportedLanguage, text: string): Record<SupportedLanguage, string> => {
    const base: Record<SupportedLanguage, string> = { ar: '', en: '', fr: '', es: '' };
    if (typeof current === 'string') {
      base.ar = current;
    } else if (current && typeof current === 'object') {
      Object.assign(base, current);
    }
    base[lang] = text;
    return base;
  };

  const cleanLocalizedVal = (val: LocalizedString | undefined): LocalizedString | undefined => {
    if (!val) return undefined;
    if (typeof val === 'string') return val.trim() || undefined;
    const cleaned: Record<string, string> = {};
    let hasAny = false;
    for (const [k, v] of Object.entries(val)) {
      if (v && v.trim()) {
        cleaned[k] = v.trim();
        hasAny = true;
      }
    }
    return hasAny ? cleaned : undefined;
  };

  // Active Store & Product objects
  const activeStore = stores.find(s => s.id === selectedStoreId) || stores[0];
  const storeProducts = products.filter(p => p.storeId === activeStore?.id || (!p.storeId && activeStore?.id === 'store-default'));
  const activeProduct = products.find(p => p.id === selectedProductId) || storeProducts[0] || products[0];

  // =========================================================================
  // 1. STORE LEVEL CMS STATE
  // =========================================================================
  const [storePrimaryColor, setStorePrimaryColor] = useState(activeStore?.design?.primaryColor || '#059669');
  const [storeSecondaryColor, setStoreSecondaryColor] = useState(activeStore?.design?.secondaryColor || '#0f172a');
  const [storeLogoType, setStoreLogoType] = useState<'text' | 'image'>(activeStore?.design?.logoType || 'text');
  const [storeLogoText, setStoreLogoText] = useState(activeStore?.design?.logoText || activeStore?.name || 'Allio');
  const [storeLogoImageUrl, setStoreLogoImageUrl] = useState(activeStore?.design?.logoImageUrl || '');
  const [storeAnnouncement, setStoreAnnouncement] = useState<LocalizedString>(activeStore?.design?.announcementText || 'توصيل مجاني لجميع المدن المغربية 🇲🇦 والدفع نقداً عند الاستلام');

  // Storefront Catalog CMS Fields
  const [storeHeroBadge, setStoreHeroBadge] = useState<LocalizedString>(activeStore?.design?.heroBadge || 'منصة الدفع عند الاستلام في المغرب');
  const [storeHeroTitle, setStoreHeroTitle] = useState<LocalizedString>(activeStore?.design?.heroTitle || 'منتجات مختارة بعناية، توصيل مجاني إلى باب منزلك');
  const [storeHeroSubtitle, setStoreHeroSubtitle] = useState<LocalizedString>(activeStore?.design?.heroSubtitle || 'لا داعي للدفع بالبطاقة البنكية مسبقاً. اطلب الآن، تفقد طلبيتك وافحصها مع الموزع، ثم ادفع نقداً بكل راحة وأمان.');

  const [storePillar1Title, setStorePillar1Title] = useState<LocalizedString>(activeStore?.design?.pillar1Title || 'توصيل مجاني 0 درهم');
  const [storePillar1Desc, setStorePillar1Desc] = useState<LocalizedString>(activeStore?.design?.pillar1Desc || 'شحن سريع لجميع مدن وقرى المغرب مجاناً');
  const [storePillar2Title, setStorePillar2Title] = useState<LocalizedString>(activeStore?.design?.pillar2Title || 'الدفع بعد المعاينة');
  const [storePillar2Desc, setStorePillar2Desc] = useState<LocalizedString>(activeStore?.design?.pillar2Desc || 'تفقد طلبيتك وتأكد منها قبل أن تدفع أي درهم للموزع');
  const [storePillar3Title, setStorePillar3Title] = useState<LocalizedString>(activeStore?.design?.pillar3Title || 'ضمان الرضا 14 يوماً');
  const [storePillar3Desc, setStorePillar3Desc] = useState<LocalizedString>(activeStore?.design?.pillar3Desc || 'إمكانية الاستبدال أو الاسترجاع بكل سهولة ومرونة');

  const [storeCatalogTitle, setStoreCatalogTitle] = useState<LocalizedString>(activeStore?.design?.catalogTitle || 'أفضل العروض الحالية في المغرب');
  const [storeCatalogSubtitle, setStoreCatalogSubtitle] = useState<LocalizedString>(activeStore?.design?.catalogSubtitle || 'منتجات أصلية مع توصيل مجاني وضمان الدفع بعد المعاينة عند باب منزلك');
  const [storeBuyButtonText, setStoreBuyButtonText] = useState<LocalizedString>(activeStore?.design?.buyButtonText || 'طلب الآن عبر الدفع عند الاستلام');
  const [storeBuyButtonColor, setStoreBuyButtonColor] = useState(activeStore?.design?.buyButtonColor || '#059669');
  const [storeFooterText, setStoreFooterText] = useState<LocalizedString>(activeStore?.design?.footerText || 'منصة التجارة الإلكترونية الموثوقة بالمغرب. نوفر تجربة تسوق آمنة وسهلة مع الدفع عند الاستلام.');
  const [storeFooterCopyright, setStoreFooterCopyright] = useState<LocalizedString>(activeStore?.design?.footerCopyright || 'جميع الحقوق محفوظة');

  // Image upload states & refs
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);

  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    const val = validateImageFile(file);
    if (!val.valid) {
      setImageError(val.error || `حجم الصورة يتجاوز الحد الأقصى المسموح به (${MAX_IMAGE_SIZE_MB} ميغابايت).`);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploadingLogo(true);
      const { dataUrl } = await processAndCompressImage(file, 800);
      setStoreLogoImageUrl(dataUrl);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'فشل رفع الشعار');
    } finally {
      setIsUploadingLogo(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  const handleHeroFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    const val = validateImageFile(file);
    if (!val.valid) {
      setImageError(val.error || `حجم الصورة يتجاوز الحد الأقصى المسموح به (${MAX_IMAGE_SIZE_MB} ميغابايت).`);
      if (heroFileInputRef.current) heroFileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploadingHero(true);
      const { dataUrl } = await processAndCompressImage(file, 1400);
      setDesignConfig(prev => ({
        ...prev,
        hero: { ...prev.hero, heroImageUrl: dataUrl }
      }));
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'فشل رفع صورة الواجهة');
    } finally {
      setIsUploadingHero(false);
      if (heroFileInputRef.current) heroFileInputRef.current.value = '';
    }
  };

  // Sync store form when active store changes
  useEffect(() => {
    if (activeStore) {
      setStorePrimaryColor(activeStore.design?.primaryColor || '#059669');
      setStoreSecondaryColor(activeStore.design?.secondaryColor || '#0f172a');
      setStoreLogoType(activeStore.design?.logoType || 'text');
      setStoreLogoText(activeStore.design?.logoText || activeStore.name || 'Allio');
      setStoreLogoImageUrl(activeStore.design?.logoImageUrl || '');
      setStoreAnnouncement(activeStore.design?.announcementText !== undefined ? activeStore.design.announcementText : 'توصيل مجاني لجميع المدن المغربية 🇲🇦 والدفع نقداً عند الاستلام');

      setStoreHeroBadge(activeStore.design?.heroBadge !== undefined ? activeStore.design.heroBadge : 'منصة الدفع عند الاستلام في المغرب');
      setStoreHeroTitle(activeStore.design?.heroTitle !== undefined ? activeStore.design.heroTitle : 'منتجات مختارة بعناية، توصيل مجاني إلى باب منزلك');
      setStoreHeroSubtitle(activeStore.design?.heroSubtitle !== undefined ? activeStore.design.heroSubtitle : 'لا داعي للدفع بالبطاقة البنكية مسبقاً. اطلب الآن، تفقد طلبيتك وافحصها مع الموزع، ثم ادفع نقداً بكل راحة وأمان.');

      setStorePillar1Title(activeStore.design?.pillar1Title !== undefined ? activeStore.design.pillar1Title : 'توصيل مجاني 0 درهم');
      setStorePillar1Desc(activeStore.design?.pillar1Desc !== undefined ? activeStore.design.pillar1Desc : 'شحن سريع لجميع مدن وقرى المغرب مجاناً');
      setStorePillar2Title(activeStore.design?.pillar2Title !== undefined ? activeStore.design.pillar2Title : 'الدفع بعد المعاينة');
      setStorePillar2Desc(activeStore.design?.pillar2Desc !== undefined ? activeStore.design.pillar2Desc : 'تفقد طلبيتك وتأكد منها قبل أن تدفع أي درهم للموزع');
      setStorePillar3Title(activeStore.design?.pillar3Title !== undefined ? activeStore.design.pillar3Title : 'ضمان الرضا 14 يوماً');
      setStorePillar3Desc(activeStore.design?.pillar3Desc !== undefined ? activeStore.design.pillar3Desc : 'إمكانية الاستبدال أو الاسترجاع بكل سهولة ومرونة');

      setStoreCatalogTitle(activeStore.design?.catalogTitle !== undefined ? activeStore.design.catalogTitle : 'أفضل العروض الحالية في المغرب');
      setStoreCatalogSubtitle(activeStore.design?.catalogSubtitle !== undefined ? activeStore.design.catalogSubtitle : 'منتجات أصلية مع توصيل مجاني وضمان الدفع بعد المعاينة عند باب منزلك');
      setStoreBuyButtonText(activeStore.design?.buyButtonText !== undefined ? activeStore.design.buyButtonText : 'طلب الآن عبر الدفع عند الاستلام');
      setStoreBuyButtonColor(activeStore.design?.buyButtonColor || '#059669');
      setStoreFooterText(activeStore.design?.footerText !== undefined ? activeStore.design.footerText : 'منصة التجارة الإلكترونية الموثوقة بالمغرب. نوفر تجربة تسوق آمنة وسهلة مع الدفع عند الاستلام.');
      setStoreFooterCopyright(activeStore.design?.footerCopyright !== undefined ? activeStore.design.footerCopyright : 'جميع الحقوق محفوظة');
    }
  }, [activeStore]);

  // =========================================================================
  // 2. LANDING PAGE LEVEL CMS STATE
  // =========================================================================
  const [designConfig, setDesignConfig] = useState<LandingPageDesignConfig>(
    activeProduct?.designConfig || getDefaultDesignConfig(activeProduct?.name, activeProduct?.fullDescription)
  );

  // Sync product design config when selected product changes
  useEffect(() => {
    if (activeProduct) {
      setDesignConfig(activeProduct.designConfig || getDefaultDesignConfig(activeProduct.name, activeProduct.fullDescription));
    }
  }, [activeProduct]);

  // Handle Save Store Level Design
  const handleSaveStoreDesign = async () => {
    if (!activeStore) return;
    setIsSaving(true);
    setSaveToast(null);

    try {
      await saveStore({
        id: activeStore.id,
        name: activeStore.name,
        slug: activeStore.slug,
        niche: activeStore.niche,
        description: activeStore.description,
        design: {
          primaryColor: storePrimaryColor,
          secondaryColor: storeSecondaryColor,
          logoType: storeLogoType,
          logoText: storeLogoText.trim() || 'Allio',
          logoImageUrl: storeLogoImageUrl.trim(),
          announcementText: cleanLocalizedVal(storeAnnouncement),
          heroBadge: cleanLocalizedVal(storeHeroBadge),
          heroTitle: cleanLocalizedVal(storeHeroTitle),
          heroSubtitle: cleanLocalizedVal(storeHeroSubtitle),
          pillar1Title: cleanLocalizedVal(storePillar1Title),
          pillar1Desc: cleanLocalizedVal(storePillar1Desc),
          pillar2Title: cleanLocalizedVal(storePillar2Title),
          pillar2Desc: cleanLocalizedVal(storePillar2Desc),
          pillar3Title: cleanLocalizedVal(storePillar3Title),
          pillar3Desc: cleanLocalizedVal(storePillar3Desc),
          catalogTitle: cleanLocalizedVal(storeCatalogTitle),
          catalogSubtitle: cleanLocalizedVal(storeCatalogSubtitle),
          buyButtonText: cleanLocalizedVal(storeBuyButtonText),
          buyButtonColor: storeBuyButtonColor,
          buyButtonTextColor: '#ffffff',
          footerText: cleanLocalizedVal(storeFooterText),
          footerCopyright: cleanLocalizedVal(storeFooterCopyright)
        }
      });

      setSaveToast('تم حفظ هوية ومحتوى واجهة المتجر بنجاح في قاعدة بيانات Firestore!');
      onDataChange();
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err) {
      console.error('Failed to save store branding:', err);
      setSaveToast('حدث خطأ أثناء حفظ تصميم المتجر.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save Landing Page Level Design
  const handleSaveLandingDesign = async () => {
    if (!activeProduct) return;
    setIsSaving(true);
    setSaveToast(null);

    try {
      await saveProduct({
        ...activeProduct,
        designConfig
      });

      setSaveToast(`تم حفظ تصميم وأقسام صفحة الهبوط "${getLocalizedText(activeProduct.name)}" بنجاح!`);
      onDataChange();
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err) {
      console.error('Failed to save landing design:', err);
      setSaveToast('حدث خطأ أثناء حفظ أقسام صفحة الهبوط.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Level Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900">
              محرر التصميم والمحتوى الديناميكي الشامل (Full Dynamic CMS)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            تحكم كامل بنسبة 100% في كافة النصوص، الأزرار، الألوان، وأقسام المتجر وصفحات الهبوط. أي حقل تتركه فارغاً أو تقوم بتعطيله سيختفي فوراً من الصفحة.
          </p>
        </div>

        {/* Level Toggle Tabs */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 self-start md:self-auto shrink-0">
          <button
            onClick={() => setEditorLevel('store')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              editorLevel === 'store'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <StoreIcon className="w-4 h-4" />
            <span>تصميم المتجر العام (Storefront CMS)</span>
          </button>

          <button
            onClick={() => setEditorLevel('landing')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              editorLevel === 'landing'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>محرر صفحة الهبوط (Landing Page CMS)</span>
          </button>
        </div>
      </div>

      {/* Multilingual Editor Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black block">
              لغة تحرير المحتوى الحالية ({SUPPORTED_LANGUAGES.find(l => l.code === cmsLang)?.nativeName}):
            </span>
            <span className="text-[11px] text-slate-400 block">
              بدّل بين اللغات لإدخال النصوص المناسبة. جميع اللغات تُحفظ داخل نفس وثيقة Firestore دون مضاعفة القراءات.
            </span>
          </div>
        </div>

        <div className="inline-flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 gap-1 self-start sm:self-auto">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = cmsLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setCmsLang(lang.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast Feedback */}
      {saveToast && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs flex items-center justify-between animate-in fade-in">
          <span>{saveToast}</span>
          <button onClick={() => setSaveToast(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            إغلاق
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* LEVEL 1: STORE LEVEL DESIGN BUILDER */}
      {/* ===================================================================== */}
      {editorLevel === 'store' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Form (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Store Picker */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <label className="text-xs font-bold text-slate-700 block">اختر المتجر / النيش للتخصيص:</label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.niche}) - /{s.slug}
                  </option>
                ))}
              </select>
            </div>

            {/* Colors Section */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-600" />
                <span>لوحة ألوان المتجر الرئيسية (Primary & Secondary Colors)</span>
              </h3>

              {/* Primary Color */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">اللون الأساسي (Primary Color - الأزرار والإبراز):</span>
                  <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{storePrimaryColor}</span>
                </div>
                
                {/* Swatches */}
                <div className="flex flex-wrap gap-2">
                  {PRESET_PRIMARY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setStorePrimaryColor(c.value)}
                      title={c.name}
                      className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 cursor-pointer ${
                        storePrimaryColor.toLowerCase() === c.value.toLowerCase()
                          ? 'border-slate-900 ring-2 ring-emerald-500/30 scale-105'
                          : 'border-white shadow-xs'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2 py-0.5 bg-slate-50">
                    <input
                      type="color"
                      value={storePrimaryColor}
                      onChange={(e) => setStorePrimaryColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] text-slate-500">مخصص</span>
                  </div>
                </div>
              </div>

              {/* Secondary Color */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">اللون الثانوي (Secondary Color - شريط الإعلانات والخلفيات الداكنة):</span>
                  <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{storeSecondaryColor}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {PRESET_SECONDARY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setStoreSecondaryColor(c.value)}
                      title={c.name}
                      className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 cursor-pointer ${
                        storeSecondaryColor.toLowerCase() === c.value.toLowerCase()
                          ? 'border-emerald-500 ring-2 ring-slate-400 scale-105'
                          : 'border-white shadow-xs'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2 py-0.5 bg-slate-50">
                    <input
                      type="color"
                      value={storeSecondaryColor}
                      onChange={(e) => setStoreSecondaryColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] text-slate-500">مخصص</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Logo & Announcement Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Type className="w-4 h-4 text-emerald-600" />
                <span>شعار المتجر وشريط الإعلانات</span>
              </h3>

              {/* Logo Type Selector */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setStoreLogoType('text')}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    storeLogoType === 'text'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  <span>شعار نصي عريض (Text Logo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStoreLogoType('image')}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    storeLogoType === 'image'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>شعار بصري / صورة (Image Logo)</span>
                </button>
              </div>

              {storeLogoType === 'text' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">النص المعروض في الشعار:</label>
                  <input
                    type="text"
                    value={storeLogoText}
                    onChange={(e) => setStoreLogoText(e.target.value)}
                    placeholder="Allio"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-black text-slate-900 bg-slate-50 focus:bg-white"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">صورة الشعار (Image Logo):</label>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      أقصى حجم: 1 ميغابايت (1MB Max)
                    </span>
                  </div>

                  {imageError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center justify-between font-semibold">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{imageError}</span>
                      </div>
                      <button type="button" onClick={() => setImageError(null)} className="text-rose-600 p-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={storeLogoImageUrl}
                      onChange={(e) => setStoreLogoImageUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      dir="ltr"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white"
                    />
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      accept="image/*"
                      onChange={handleLogoFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingLogo}
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>رفع (≤ 1MB)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Announcement Bar */}
              <div className="pt-3 border-t border-slate-100 space-y-1">
                <label className="text-xs font-bold text-slate-700 block">شريط الإعلانات العلوي (اتركه فارغاً لإخفائه تماماً):</label>
                <input
                  type="text"
                  value={getFieldVal(storeAnnouncement, cmsLang)}
                  onChange={(e) => setStoreAnnouncement(updateFieldVal(storeAnnouncement, cmsLang, e.target.value))}
                  placeholder="توصيل مجاني لجميع المدن المغربية 🇲🇦 والدفع نقداً عند الاستلام"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Storefront Catalog Hero CMS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>واجهة المتجر الرئيسي (Storefront Hero Banner)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                تحكم في نصوص واجهة المتجر الرئيسية. إذا مسحت أي حقل، سيختفي هذا العنصر تلقائياً من الصفحة.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">شارة الواجهة (Hero Badge):</label>
                  <input
                    type="text"
                    value={getFieldVal(storeHeroBadge, cmsLang)}
                    onChange={(e) => setStoreHeroBadge(updateFieldVal(storeHeroBadge, cmsLang, e.target.value))}
                    placeholder="منصة الدفع عند الاستلام في المغرب (اتركه فارغاً لإخفائه)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">العنوان الرئيسي للمتجر (Hero Headline):</label>
                  <input
                    type="text"
                    value={getFieldVal(storeHeroTitle, cmsLang)}
                    onChange={(e) => setStoreHeroTitle(updateFieldVal(storeHeroTitle, cmsLang, e.target.value))}
                    placeholder="منتجات مختارة بعناية، توصيل مجاني إلى باب منزلك"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">الوصف الفرعي للواجهة (Hero Subtitle):</label>
                  <textarea
                    rows={2}
                    value={getFieldVal(storeHeroSubtitle, cmsLang)}
                    onChange={(e) => setStoreHeroSubtitle(updateFieldVal(storeHeroSubtitle, cmsLang, e.target.value))}
                    placeholder="لا داعي للدفع بالبطاقة البنكية مسبقاً..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Storefront 3 Pillars (Trust Cards) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>ركائز الثقة الثلاث (3 Trust Pillars)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                اترك عنوان أي ركيزة فارغاً لإخفاء صندوقها كلياً من المتجر.
              </p>

              <div className="space-y-3 text-xs">
                {/* Pillar 1 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>الركيزة الأولى (الشحن والتوصيل):</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={getFieldVal(storePillar1Title, cmsLang)}
                      onChange={(e) => setStorePillar1Title(updateFieldVal(storePillar1Title, cmsLang, e.target.value))}
                      placeholder="توصيل مجاني 0 درهم"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                    <input
                      type="text"
                      value={getFieldVal(storePillar1Desc, cmsLang)}
                      onChange={(e) => setStorePillar1Desc(updateFieldVal(storePillar1Desc, cmsLang, e.target.value))}
                      placeholder="لكافة المدن والقرى المغربية"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>الركيزة الثانية (الدفع والمعاينة):</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={getFieldVal(storePillar2Title, cmsLang)}
                      onChange={(e) => setStorePillar2Title(updateFieldVal(storePillar2Title, cmsLang, e.target.value))}
                      placeholder="الدفع بعد المعاينة"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                    <input
                      type="text"
                      value={getFieldVal(storePillar2Desc, cmsLang)}
                      onChange={(e) => setStorePillar2Desc(updateFieldVal(storePillar2Desc, cmsLang, e.target.value))}
                      placeholder="افحص جودة منتجك أولاً"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>الركيزة الثالثة (الضمان والاسترجاع):</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={getFieldVal(storePillar3Title, cmsLang)}
                      onChange={(e) => setStorePillar3Title(updateFieldVal(storePillar3Title, cmsLang, e.target.value))}
                      placeholder="ضمان 14 يوماً"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                    <input
                      type="text"
                      value={getFieldVal(storePillar3Desc, cmsLang)}
                      onChange={(e) => setStorePillar3Desc(updateFieldVal(storePillar3Desc, cmsLang, e.target.value))}
                      placeholder="استبدال أو استرجاع بدون تعقيد"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Catalog & Cards Buttons */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>أزرار المنتجات والتذييل (Catalog & Footer CMS)</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">عنوان قسم الكتالوج:</label>
                  <input
                    type="text"
                    value={getFieldVal(storeCatalogTitle, cmsLang)}
                    onChange={(e) => setStoreCatalogTitle(updateFieldVal(storeCatalogTitle, cmsLang, e.target.value))}
                    placeholder="العروض المتوفرة اليوم"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">نص زر بطاقة المنتج:</label>
                    <input
                      type="text"
                      value={getFieldVal(storeBuyButtonText, cmsLang)}
                      onChange={(e) => setStoreBuyButtonText(updateFieldVal(storeBuyButtonText, cmsLang, e.target.value))}
                      placeholder="طلب الآن عبر الدفع عند الاستلام"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">لون زر بطاقة المنتج:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={storeBuyButtonColor}
                        onChange={(e) => setStoreBuyButtonColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 bg-white"
                      />
                      <span className="font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded text-xs">{storeBuyButtonColor}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">نص تذييل المتجر (Footer Text):</label>
                  <textarea
                    rows={2}
                    value={getFieldVal(storeFooterText, cmsLang)}
                    onChange={(e) => setStoreFooterText(updateFieldVal(storeFooterText, cmsLang, e.target.value))}
                    placeholder="منصة التجارة الإلكترونية الموثوقة بالمغرب..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleSaveStoreDesign}
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>حفظ هوية وتصميم المتجر بالكامل (Save Store CMS)</span>
              </button>
            </div>
          </div>

          {/* Interactive Live Preview (lg:col-span-5) */}
          <div className="lg:col-span-5 sticky top-20 space-y-4">
            <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>معاينة حية للمتجر (Live Storefront Preview)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">تحديث فوري</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden max-h-[750px] overflow-y-auto">
              {/* Mock Announcement */}
              {(() => {
                const ann = getLocalizedText(storeAnnouncement, cmsLang);
                if (!ann || !ann.trim()) return null;
                return (
                  <div 
                    className="py-1.5 px-3 text-center text-[10px] text-white font-bold transition-colors"
                    style={{ backgroundColor: storeSecondaryColor }}
                  >
                    {ann}
                  </div>
                );
              })()}

              {/* Mock Header */}
              <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white">
                {storeLogoType === 'image' && storeLogoImageUrl ? (
                  <img src={storeLogoImageUrl} alt="Logo" className="h-6 w-auto object-contain" />
                ) : (
                  <span className="text-lg font-black tracking-tight" style={{ color: storePrimaryColor }}>
                    {storeLogoText || 'Allio'}
                  </span>
                )}
                <span 
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                  style={{ 
                    backgroundColor: `${storePrimaryColor}10`,
                    borderColor: `${storePrimaryColor}30`,
                    color: storePrimaryColor
                  }}
                >
                  الدفع بعد المعاينة
                </span>
              </div>

              {/* Mock Hero */}
              {(() => {
                const hBadge = getLocalizedText(storeHeroBadge, cmsLang);
                const hTitle = getLocalizedText(storeHeroTitle, cmsLang);
                const hSub = getLocalizedText(storeHeroSubtitle, cmsLang);

                if (hBadge?.trim() || hTitle?.trim() || hSub?.trim()) {
                  return (
                    <div className="p-4 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100 text-center space-y-2">
                      {hBadge?.trim() && (
                        <span 
                          className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${storePrimaryColor}15`, color: storePrimaryColor }}
                        >
                          {hBadge}
                        </span>
                      )}
                      {hTitle?.trim() && (
                        <h4 className="font-black text-sm text-slate-900">{hTitle}</h4>
                      )}
                      {hSub?.trim() && (
                        <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">{hSub}</p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Mock Pillars */}
              {(() => {
                const p1Title = getLocalizedText(storePillar1Title, cmsLang);
                const p1Desc = getLocalizedText(storePillar1Desc, cmsLang);
                const p2Title = getLocalizedText(storePillar2Title, cmsLang);
                const p2Desc = getLocalizedText(storePillar2Desc, cmsLang);
                const p3Title = getLocalizedText(storePillar3Title, cmsLang);
                const p3Desc = getLocalizedText(storePillar3Desc, cmsLang);

                if (p1Title?.trim() || p2Title?.trim() || p3Title?.trim()) {
                  return (
                    <div className="p-3 bg-slate-50 border-b border-slate-100 space-y-1.5">
                      {p1Title?.trim() && (
                        <div className="bg-white p-2 rounded-lg border border-slate-200 text-[10px] flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5" style={{ color: storePrimaryColor }} />
                          <span className="font-bold text-slate-800">{p1Title}</span>
                          <span className="text-slate-400 mr-auto">{p1Desc}</span>
                        </div>
                      )}
                      {p2Title?.trim() && (
                        <div className="bg-white p-2 rounded-lg border border-slate-200 text-[10px] flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5" style={{ color: storePrimaryColor }} />
                          <span className="font-bold text-slate-800">{p2Title}</span>
                          <span className="text-slate-400 mr-auto">{p2Desc}</span>
                        </div>
                      )}
                      {p3Title?.trim() && (
                        <div className="bg-white p-2 rounded-lg border border-slate-200 text-[10px] flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5" style={{ color: storePrimaryColor }} />
                          <span className="font-bold text-slate-800">{p3Title}</span>
                          <span className="text-slate-400 mr-auto">{p3Desc}</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Mock Product Card with Custom Button */}
              {(() => {
                const catTitle = getLocalizedText(storeCatalogTitle, cmsLang) || 'العروض المتوفرة:';
                const buyBtn = getLocalizedText(storeBuyButtonText, cmsLang);

                return (
                  <div className="p-4 space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">{catTitle}</span>
                    <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                      <div className="h-20 bg-slate-200/60 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                        صورة المنتج
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">منتج نموذجي عالي الجودة</span>
                        <span className="font-black" style={{ color: storePrimaryColor }}>199 DH</span>
                      </div>
                      {buyBtn?.trim() && (
                        <button
                          type="button"
                          className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white transition-opacity flex items-center justify-between"
                          style={{ backgroundColor: storeBuyButtonColor || storePrimaryColor }}
                        >
                          <span>{buyBtn}</span>
                          <ArrowRight className="w-3 h-3 rotate-180" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Mock Footer */}
              {(() => {
                const footTxt = getLocalizedText(storeFooterText, cmsLang);
                const footCopy = getLocalizedText(storeFooterCopyright, cmsLang) || 'جميع الحقوق محفوظة';

                if (!footTxt?.trim()) return null;
                return (
                  <div className="p-3 bg-slate-900 text-slate-400 text-[10px] text-center space-y-1">
                    <p>{footTxt}</p>
                    <p className="text-slate-500">© {new Date().getFullYear()} {storeLogoText} — {footCopy}</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* LEVEL 2: LANDING PAGE LEVEL DESIGN BUILDER */}
      {/* ===================================================================== */}
      {editorLevel === 'landing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Form (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Landing Page Picker */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">اختر صفحة الهبوط لتعديل عناصرها:</label>
                {activeProduct && (
                  <button
                    onClick={() => onViewProduct(activeProduct)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>فتح الصفحة كاملة</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                )}
              </div>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
              >
                {products.map((p) => {
                  const linkedStore = stores.find(s => s.id === p.storeId);
                  return (
                    <option key={p.id} value={p.id}>
                      {getLocalizedText(p.name)} ({p.price} DH) - [متجر: {linkedStore?.name || 'الرئيسي'}]
                    </option>
                  );
                })}
              </select>
            </div>

            {/* SECTION: HEADER CTA BUTTON */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>زر الطلب في رأس الصفحة (Header CTA Button)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                اترك النص فارغاً لإخفاء الزر بالكامل من شريط التنقل العلوي.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">نص زر رأس الصفحة:</label>
                  <input
                    type="text"
                    value={getFieldVal(designConfig.headerCtaText, cmsLang)}
                    onChange={(e) => setDesignConfig({ ...designConfig, headerCtaText: updateFieldVal(designConfig.headerCtaText, cmsLang, e.target.value) })}
                    placeholder="اطلب الآن (اتركه فارغاً لإخفائه)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">لون زر رأس الصفحة:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={designConfig.headerCtaColor || storePrimaryColor}
                      onChange={(e) => setDesignConfig({ ...designConfig, headerCtaColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 bg-white"
                    />
                    <span className="font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded text-xs">
                      {designConfig.headerCtaColor || storePrimaryColor}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 1: HERO */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">1. قسم الواجهة التسويقية (Hero Section)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDesignConfig({
                    ...designConfig,
                    hero: { ...designConfig.hero, enabled: !designConfig.hero.enabled }
                  })}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    designConfig.hero.enabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {designConfig.hero.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{designConfig.hero.enabled ? 'مفعل (ظاهر)' : 'معطل (مخفي)'}</span>
                </button>
              </div>

              {designConfig.hero.enabled && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">الشارة الترويجية (Badge Text):</label>
                    <input
                      type="text"
                      value={getFieldVal(designConfig.hero.badgeText, cmsLang)}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        hero: { ...designConfig.hero, badgeText: updateFieldVal(designConfig.hero.badgeText, cmsLang, e.target.value) }
                      })}
                      placeholder="عرض حصري بالمغرب 🔥 (اتركه فارغاً لإخفائه)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">العنوان الرئيسي (Headline):</label>
                    <input
                      type="text"
                      value={getFieldVal(designConfig.hero.headline, cmsLang)}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        hero: { ...designConfig.hero, headline: updateFieldVal(designConfig.hero.headline, cmsLang, e.target.value) }
                      })}
                      placeholder="عنوان جذاب يبرز الفائدة الرئيسية"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">الوصف الفرعي (Subheadline):</label>
                    <textarea
                      rows={2}
                      value={getFieldVal(designConfig.hero.subheadline, cmsLang)}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        hero: { ...designConfig.hero, subheadline: updateFieldVal(designConfig.hero.subheadline, cmsLang, e.target.value) }
                      })}
                      placeholder="وصف مشوق يدعم العنوان (اتركه فارغاً لإخفائه)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">نص زر الطلب في الواجهة (CTA Button):</label>
                      <input
                        type="text"
                        value={getFieldVal(designConfig.hero.ctaText, cmsLang)}
                        onChange={(e) => setDesignConfig({
                          ...designConfig,
                          hero: { ...designConfig.hero, ctaText: updateFieldVal(designConfig.hero.ctaText, cmsLang, e.target.value) }
                        })}
                        placeholder="اطلب الآن - الدفع عند الاستلام (اتركه فارغاً لإخفائه)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">لون زر الواجهة:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={designConfig.hero.ctaColor || storePrimaryColor}
                          onChange={(e) => setDesignConfig({
                            ...designConfig,
                            hero: { ...designConfig.hero, ctaColor: e.target.value }
                          })}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 bg-white"
                        />
                        <span className="font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded text-xs">
                          {designConfig.hero.ctaColor || storePrimaryColor}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hero Image */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">صورة الواجهة (اختياري - ≤ 1MB):</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="اتركه فارغاً لاستخدام صور المنتج الرئيسية"
                        value={designConfig.hero.heroImageUrl || ''}
                        onChange={(e) => setDesignConfig({
                          ...designConfig,
                          hero: { ...designConfig.hero, heroImageUrl: e.target.value }
                        })}
                        dir="ltr"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono"
                      />
                      <input
                        type="file"
                        ref={heroFileInputRef}
                        accept="image/*"
                        onChange={handleHeroFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploadingHero}
                        onClick={() => heroFileInputRef.current?.click()}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingHero ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>رفع</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: SCARCITY & LIVE VIEWERS KICKER */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-sm text-slate-900">2. شريط ندرة المخزون والزوار (Scarcity Banner)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDesignConfig({
                    ...designConfig,
                    scarcity: {
                      enabled: designConfig.scarcity ? !designConfig.scarcity.enabled : false,
                      stockText: designConfig.scarcity?.stockText || 'طلب مرتفع اليوم بالمغرب: بقي فقط {stock} قطع بالمستودع',
                      viewersText: designConfig.scarcity?.viewersText || '{count} زائر يتصفحون هذا العرض حالياً'
                    }
                  })}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    (designConfig.scarcity?.enabled ?? true)
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {(designConfig.scarcity?.enabled ?? true) ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{(designConfig.scarcity?.enabled ?? true) ? 'مفعل (ظاهر)' : 'معطل (مخفي)'}</span>
                </button>
              </div>

              {(designConfig.scarcity?.enabled ?? true) && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">نص ندرة المخزون (استخدم {'{stock}'} لعرض الكمية المتبقية):</label>
                    <input
                      type="text"
                      value={getFieldVal(designConfig.scarcity?.stockText, cmsLang)}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        scarcity: {
                          enabled: true,
                          stockText: updateFieldVal(designConfig.scarcity?.stockText, cmsLang, e.target.value),
                          viewersText: designConfig.scarcity?.viewersText || ''
                        }
                      })}
                      placeholder="اتركه فارغاً لإخفاء سطر المخزون"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">نص عدد الزوار النشطين (استخدم {'{count}'} للعدد التفاعلي):</label>
                    <input
                      type="text"
                      value={getFieldVal(designConfig.scarcity?.viewersText, cmsLang)}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        scarcity: {
                          enabled: true,
                          stockText: designConfig.scarcity?.stockText || '',
                          viewersText: updateFieldVal(designConfig.scarcity?.viewersText, cmsLang, e.target.value)
                        }
                      })}
                      placeholder="اتركه فارغاً لإخفاء سطر الزوار"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: FEATURES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">3. قسم المميزات والمواصفات (Features Section)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDesignConfig({
                    ...designConfig,
                    features: { ...designConfig.features, enabled: !designConfig.features.enabled }
                  })}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    designConfig.features.enabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {designConfig.features.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{designConfig.features.enabled ? 'مفعل (ظاهر)' : 'معطل (مخفي)'}</span>
                </button>
              </div>

              {designConfig.features.enabled && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">عنوان القسم:</label>
                    <input
                      type="text"
                      value={getFieldVal(designConfig.features.title, cmsLang)}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        features: { ...designConfig.features, title: updateFieldVal(designConfig.features.title, cmsLang, e.target.value) }
                      })}
                      placeholder="أهم المميزات والمواصفات"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                    />
                  </div>

                  {/* Features List */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 block">نقاط المميزات ({designConfig.features.items.length}):</label>
                    {designConfig.features.items.map((feat, idx) => (
                      <div key={feat.id || idx} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={getFieldVal(feat.title, cmsLang)}
                          onChange={(e) => {
                            const newItems = [...designConfig.features.items];
                            newItems[idx] = { ...newItems[idx], title: updateFieldVal(newItems[idx].title, cmsLang, e.target.value) };
                            setDesignConfig({
                              ...designConfig,
                              features: { ...designConfig.features, items: newItems }
                            });
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = designConfig.features.items.filter((_, i) => i !== idx);
                            setDesignConfig({
                              ...designConfig,
                              features: { ...designConfig.features, items: newItems }
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [
                          ...designConfig.features.items,
                          { id: `f-${Date.now()}`, title: 'ميزة جديدة حصرية' }
                        ];
                        setDesignConfig({
                          ...designConfig,
                          features: { ...designConfig.features, items: newItems }
                        });
                      }}
                      className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة ميزة جديدة</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: TESTIMONIALS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">4. قسم آراء وتقييمات الزبائن (Testimonials Section)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDesignConfig({
                    ...designConfig,
                    testimonials: { ...designConfig.testimonials, enabled: !designConfig.testimonials.enabled }
                  })}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    designConfig.testimonials.enabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {designConfig.testimonials.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{designConfig.testimonials.enabled ? 'مفعل (ظاهر)' : 'معطل (مخفي)'}</span>
                </button>
              </div>

              {designConfig.testimonials.enabled && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">عنوان قسم التقييمات:</label>
                    <input
                      type="text"
                      value={getFieldVal(designConfig.testimonials.title, cmsLang)}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        testimonials: { ...designConfig.testimonials, title: updateFieldVal(designConfig.testimonials.title, cmsLang, e.target.value) }
                      })}
                      placeholder="آراء وتقييمات زبنائنا في المغرب"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">شارة المشتري المؤكد:</label>
                      <input
                        type="text"
                        value={getFieldVal(designConfig.testimonials.verifiedBadgeText, cmsLang)}
                        onChange={(e) => setDesignConfig({
                          ...designConfig,
                          testimonials: { ...designConfig.testimonials, verifiedBadgeText: updateFieldVal(designConfig.testimonials.verifiedBadgeText, cmsLang, e.target.value) }
                        })}
                        placeholder="اتركه فارغاً لإخفاء الشارة"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">ملاحظة التقييمات الموثقة:</label>
                      <input
                        type="text"
                        value={getFieldVal(designConfig.testimonials.ratingNoteText, cmsLang)}
                        onChange={(e) => setDesignConfig({
                          ...designConfig,
                          testimonials: { ...designConfig.testimonials, ratingNoteText: updateFieldVal(designConfig.testimonials.ratingNoteText, cmsLang, e.target.value) }
                        })}
                        placeholder="اتركه فارغاً لإخفاء الملاحظة"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                      />
                    </div>
                  </div>

                  {/* Testimonials Cards */}
                  <div className="space-y-3">
                    {designConfig.testimonials.items.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">تقييم #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = designConfig.testimonials.items.filter((_, i) => i !== idx);
                              setDesignConfig({
                                ...designConfig,
                                testimonials: { ...designConfig.testimonials, items: newItems }
                              });
                            }}
                            className="text-rose-600 hover:text-rose-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={getFieldVal(item.name, cmsLang)}
                            onChange={(e) => {
                              const newItems = [...designConfig.testimonials.items];
                              newItems[idx] = { ...newItems[idx], name: updateFieldVal(newItems[idx].name, cmsLang, e.target.value) };
                              setDesignConfig({
                                ...designConfig,
                                testimonials: { ...designConfig.testimonials, items: newItems }
                              });
                            }}
                            placeholder="اسم الزبون"
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                          />
                          <input
                            type="text"
                            value={getFieldVal(item.city, cmsLang)}
                            onChange={(e) => {
                              const newItems = [...designConfig.testimonials.items];
                              newItems[idx] = { ...newItems[idx], city: updateFieldVal(newItems[idx].city, cmsLang, e.target.value) };
                              setDesignConfig({
                                ...designConfig,
                                testimonials: { ...designConfig.testimonials, items: newItems }
                              });
                            }}
                            placeholder="المدينة (الدار البيضاء، الرباط...)"
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                          />
                        </div>

                        <textarea
                          rows={2}
                          value={getFieldVal(item.comment, cmsLang)}
                          onChange={(e) => {
                            const newItems = [...designConfig.testimonials.items];
                            newItems[idx] = { ...newItems[idx], comment: updateFieldVal(newItems[idx].comment, cmsLang, e.target.value) };
                            setDesignConfig({
                              ...designConfig,
                              testimonials: { ...designConfig.testimonials, items: newItems }
                            });
                          }}
                          placeholder="نص تعليق ورأي الزبون في المنتج..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [
                          ...designConfig.testimonials.items,
                          {
                            id: `t-${Date.now()}`,
                            name: 'زبون جديد',
                            city: 'مراكش',
                            rating: 5,
                            comment: 'تجربة ممتازة وتعامل احترافي جداً!'
                          }
                        ];
                        setDesignConfig({
                          ...designConfig,
                          testimonials: { ...designConfig.testimonials, items: newItems }
                        });
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة تقييم زبون</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 5: GUARANTEE */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">5. قسم الضمان وثقة الزبون (Guarantee Section)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDesignConfig({
                    ...designConfig,
                    guarantee: { ...designConfig.guarantee, enabled: !designConfig.guarantee.enabled }
                  })}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    designConfig.guarantee.enabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {designConfig.guarantee.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{designConfig.guarantee.enabled ? 'مفعل (ظاهر)' : 'معطل (مخفي)'}</span>
                </button>
              </div>

              {designConfig.guarantee.enabled && (
                <div className="space-y-3 text-xs">
                  <p className="text-[11px] text-slate-500">
                    إذا مسحت العنوان والوصف، سيختفي صندوق الضمان كلياً من الصفحة.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">عنوان الضمان:</label>
                      <input
                        type="text"
                        value={getFieldVal(designConfig.guarantee.title, cmsLang)}
                        onChange={(e) => setDesignConfig({
                          ...designConfig,
                          guarantee: { ...designConfig.guarantee, title: updateFieldVal(designConfig.guarantee.title, cmsLang, e.target.value) }
                        })}
                        placeholder="ضمان الرضا والجودة في متجرنا"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">شارة الضمان (Badge Text):</label>
                      <input
                        type="text"
                        value={getFieldVal(designConfig.guarantee.badgeText, cmsLang)}
                        onChange={(e) => setDesignConfig({
                          ...designConfig,
                          guarantee: { ...designConfig.guarantee, badgeText: updateFieldVal(designConfig.guarantee.badgeText, cmsLang, e.target.value) }
                        })}
                        placeholder="ضمان ذهبي 100% (اتركه فارغاً لإخفائه)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">تفاصيل الضمان وسياسة المعاينة قبل الدفع:</label>
                    <textarea
                      rows={2}
                      value={getFieldVal(designConfig.guarantee.description, cmsLang)}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        guarantee: { ...designConfig.guarantee, description: updateFieldVal(designConfig.guarantee.description, cmsLang, e.target.value) }
                      })}
                      placeholder="نوفر لكم إمكانية المعاينة قبل الدفع..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs leading-relaxed"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 6: REASSURANCES BULLETS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">6. نقاط الطمأنينة بجانب السعر (Reassurances Bullets)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDesignConfig({
                    ...designConfig,
                    reassurances: {
                      enabled: designConfig.reassurances ? !designConfig.reassurances.enabled : false,
                      items: designConfig.reassurances?.items || [
                        'الدفع عند الاستلام نقداً بعد فحص السلعة',
                        'شحن سريع لجميع مدن المغرب خلال 24 إلى 48 ساعة',
                        'ضمان الرضا أو الاسترجاع والاستبدال خلال 14 يوماً'
                      ]
                    }
                  })}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    (designConfig.reassurances?.enabled ?? true)
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {(designConfig.reassurances?.enabled ?? true) ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{(designConfig.reassurances?.enabled ?? true) ? 'مفعل (ظاهر)' : 'معطل (مخفي)'}</span>
                </button>
              </div>

              {(designConfig.reassurances?.enabled ?? true) && (
                <div className="space-y-2 text-xs">
                  <p className="text-[11px] text-slate-500">
                    تظهر هذه النقاط أسفل السعر في العمود الأيمن لتعزيز ثقة الزبون. اترك أي نقطة فارغة لإخفائها.
                  </p>
                  {(designConfig.reassurances?.items || [
                    'الدفع عند الاستلام نقداً بعد فحص السلعة',
                    'شحن سريع لجميع مدن المغرب خلال 24 إلى 48 ساعة',
                    'ضمان الرضا أو الاسترجاع والاستبدال خلال 14 يوماً'
                  ]).map((point, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-bold text-slate-500 w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        value={getFieldVal(point, cmsLang)}
                        onChange={(e) => {
                          const current = designConfig.reassurances?.items || [
                            'الدفع عند الاستلام نقداً بعد فحص السلعة',
                            'شحن سريع لجميع مدن المغرب خلال 24 إلى 48 ساعة',
                            'ضمان الرضا أو الاسترجاع والاستبدال خلال 14 يوماً'
                          ];
                          const updated = [...current];
                          updated[idx] = updateFieldVal(updated[idx], cmsLang, e.target.value);
                          setDesignConfig({
                            ...designConfig,
                            reassurances: { enabled: true, items: updated }
                          });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 7: MOROCCAN ORDER FORM & CTA CUSTOMIZATION */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>7. استمارة الطلب وزر التأكيد (COD Order Form & Badges)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                خصص نصوص شريط الاستمارة، زر الإرسال، شارات التوصيل والضمان. أي نص تتركه فارغاً سيختفي كلياً من الاستمارة.
              </p>

              <div className="space-y-4 text-xs">
                {/* Form Header */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 block">عنوان ووصف رأس الاستمارة:</span>
                  <input
                    type="text"
                    value={getFieldVal(designConfig.orderForm?.title, cmsLang)}
                    onChange={(e) => setDesignConfig({
                      ...designConfig,
                      orderForm: { ...designConfig.orderForm, enabled: true, title: updateFieldVal(designConfig.orderForm?.title, cmsLang, e.target.value) }
                    })}
                    placeholder="عنوان الاستمارة (اتركه فارغاً لإخفاء الشريط العلوي كلياً)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                  />
                  <input
                    type="text"
                    value={getFieldVal(designConfig.orderForm?.subtitle, cmsLang)}
                    onChange={(e) => setDesignConfig({
                      ...designConfig,
                      orderForm: { ...designConfig.orderForm, enabled: true, subtitle: updateFieldVal(designConfig.orderForm?.subtitle, cmsLang, e.target.value) }
                    })}
                    placeholder="الوصف التوضيحي للاستمارة"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                {/* Submit Button CMS */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 block">زر إرسال الطلب الكبير (Submit CTA Button):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={getFieldVal(designConfig.orderForm?.submitButtonText, cmsLang)}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        orderForm: { ...designConfig.orderForm, enabled: true, submitButtonText: updateFieldVal(designConfig.orderForm?.submitButtonText, cmsLang, e.target.value) }
                      })}
                      placeholder="نص زر الطلب"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-black"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 font-bold">لون الزر:</span>
                      <input
                        type="color"
                        value={designConfig.orderForm?.submitButtonColor || storePrimaryColor}
                        onChange={(e) => setDesignConfig({
                          ...designConfig,
                          orderForm: { ...designConfig.orderForm, enabled: true, submitButtonColor: e.target.value }
                        })}
                        className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200 bg-white"
                      />
                      <span className="font-mono text-slate-500 bg-white px-2 py-0.5 rounded text-xs">
                        {designConfig.orderForm?.submitButtonColor || storePrimaryColor}
                      </span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={getFieldVal(designConfig.orderForm?.submitButtonSubtext, cmsLang)}
                    onChange={(e) => setDesignConfig({
                      ...designConfig,
                      orderForm: { ...designConfig.orderForm, enabled: true, submitButtonSubtext: updateFieldVal(designConfig.orderForm?.submitButtonSubtext, cmsLang, e.target.value) }
                    })}
                    placeholder="النص الفرعي للزر (اتركه فارغاً لإخفائه)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600"
                  />
                </div>

                {/* Micro-copy Notices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">ملاحظة التوصيل المجاني:</label>
                    <input
                      type="text"
                      value={getFieldVal(designConfig.orderForm?.freeShippingText, cmsLang)}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        orderForm: { ...designConfig.orderForm, enabled: true, freeShippingText: updateFieldVal(designConfig.orderForm?.freeShippingText, cmsLang, e.target.value) }
                      })}
                      placeholder="اتركه فارغاً لإخفائه"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">ملاحظة تأكيد الهاتف:</label>
                    <input
                      type="text"
                      value={getFieldVal(designConfig.orderForm?.callConfirmationText, cmsLang)}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        orderForm: { ...designConfig.orderForm, enabled: true, callConfirmationText: updateFieldVal(designConfig.orderForm?.callConfirmationText, cmsLang, e.target.value) }
                      })}
                      placeholder="اتركه فارغاً لإخفائه"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                    />
                  </div>
                </div>

                {/* Bottom Trust Badges */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-800 block">شارات الثقة الثلاث أسفل الاستمارة:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Badge 1 */}
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">الشارة 1 (التوصيل):</span>
                      <input
                        type="text"
                        value={getFieldVal(designConfig.orderForm?.trustBadge1Title, cmsLang)}
                        onChange={(e) => setDesignConfig({
                          ...designConfig,
                          orderForm: { ...designConfig.orderForm, enabled: true, trustBadge1Title: updateFieldVal(designConfig.orderForm?.trustBadge1Title, cmsLang, e.target.value) }
                        })}
                        placeholder="العنوان"
                        className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={getFieldVal(designConfig.orderForm?.trustBadge1Sub, cmsLang)}
                        onChange={(e) => setDesignConfig({
                          ...designConfig,
                          orderForm: { ...designConfig.orderForm, enabled: true, trustBadge1Sub: updateFieldVal(designConfig.orderForm?.trustBadge1Sub, cmsLang, e.target.value) }
                        })}
                        placeholder="الوصف"
                        className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-[10px]"
                      />
                    </div>

                    {/* Badge 2 */}
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">الشارة 2 (الدفع):</span>
                      <input
                        type="text"
                        value={getFieldVal(designConfig.orderForm?.trustBadge2Title, cmsLang)}
                        onChange={(e) => setDesignConfig({
                          ...designConfig,
                          orderForm: { ...designConfig.orderForm, enabled: true, trustBadge2Title: updateFieldVal(designConfig.orderForm?.trustBadge2Title, cmsLang, e.target.value) }
                        })}
                        placeholder="العنوان"
                        className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={getFieldVal(designConfig.orderForm?.trustBadge2Sub, cmsLang)}
                        onChange={(e) => setDesignConfig({
                          ...designConfig,
                          orderForm: { ...designConfig.orderForm, enabled: true, trustBadge2Sub: updateFieldVal(designConfig.orderForm?.trustBadge2Sub, cmsLang, e.target.value) }
                        })}
                        placeholder="الوصف"
                        className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-[10px]"
                      />
                    </div>

                    {/* Badge 3 */}
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">الشارة 3 (الضمان):</span>
                      <input
                        type="text"
                        value={getFieldVal(designConfig.orderForm?.trustBadge3Title, cmsLang)}
                        onChange={(e) => setDesignConfig({
                          ...designConfig,
                          orderForm: { ...designConfig.orderForm, enabled: true, trustBadge3Title: updateFieldVal(designConfig.orderForm?.trustBadge3Title, cmsLang, e.target.value) }
                        })}
                        placeholder="العنوان"
                        className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={getFieldVal(designConfig.orderForm?.trustBadge3Sub, cmsLang)}
                        onChange={(e) => setDesignConfig({
                          ...designConfig,
                          orderForm: { ...designConfig.orderForm, enabled: true, trustBadge3Sub: updateFieldVal(designConfig.orderForm?.trustBadge3Sub, cmsLang, e.target.value) }
                        })}
                        placeholder="الوصف"
                        className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 8: STICKY MOBILE CTA & FOOTER */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>8. زر الهاتف العائم وتذييل الصفحة (Sticky CTA & Footer)</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">نص زر الشراء العائم بالهاتف (Mobile Sticky Button):</label>
                  <input
                    type="text"
                    value={getFieldVal(designConfig.stickyMobileCtaText, cmsLang)}
                    onChange={(e) => setDesignConfig({ ...designConfig, stickyMobileCtaText: updateFieldVal(designConfig.stickyMobileCtaText, cmsLang, e.target.value) })}
                    placeholder="اطلب الآن - الدفع عند الاستلام (اتركه فارغاً لإخفائه)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">نص تذييل صفحة الهبوط:</label>
                    <input
                      type="text"
                      value={getFieldVal(designConfig.footer?.text, cmsLang)}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        footer: {
                          enabled: true,
                          text: updateFieldVal(designConfig.footer?.text, cmsLang, e.target.value),
                          copyrightText: designConfig.footer?.copyrightText || ''
                        }
                      })}
                      placeholder="متجر مغربي موثوق يوفر تجربة تسوق مريحة..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">حقوق النشر (Copyright):</label>
                    <input
                      type="text"
                      value={getFieldVal(designConfig.footer?.copyrightText, cmsLang)}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        footer: {
                          enabled: true,
                          text: designConfig.footer?.text || '',
                          copyrightText: updateFieldVal(designConfig.footer?.copyrightText, cmsLang, e.target.value)
                        }
                      })}
                      placeholder="جميع الحقوق محفوظة"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleSaveLandingDesign}
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>حفظ محتوى وأقسام صفحة الهبوط بالكامل (Save Landing CMS)</span>
              </button>
            </div>
          </div>

          {/* Real-time Preview Drawer (lg:col-span-5) */}
          <div className="lg:col-span-5 sticky top-20 space-y-4">
            <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>معاينة حية لصفحة الهبوط (Live Sections Preview)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Real-time</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 space-y-4 max-h-[750px] overflow-y-auto">
              {/* Header Preview */}
              {(() => {
                const headerCta = getLocalizedText(designConfig.headerCtaText, cmsLang);
                return (
                  <div className="p-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-black text-slate-800 text-sm">{activeStore?.name || 'Allio'}</span>
                    {headerCta?.trim() && (
                      <span 
                        className="text-[10px] text-white font-bold px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: designConfig.headerCtaColor || storePrimaryColor }}
                      >
                        {headerCta}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Hero Preview */}
              {(() => {
                const pHeroHeadline = getLocalizedText(designConfig.hero.headline, cmsLang) || getLocalizedText(activeProduct?.name, cmsLang);
                const pHeroBadge = getLocalizedText(designConfig.hero.badgeText, cmsLang);
                const pHeroSub = getLocalizedText(designConfig.hero.subheadline, cmsLang);
                const pHeroCta = getLocalizedText(designConfig.hero.ctaText, cmsLang);

                if (designConfig.hero.enabled && Boolean(pHeroHeadline?.trim() || pHeroBadge?.trim() || pHeroCta?.trim())) {
                  return (
                    <div 
                      className="rounded-xl p-4 text-white text-center space-y-2 transition-all shadow-xs"
                      style={{ backgroundColor: storeSecondaryColor }}
                    >
                      {pHeroBadge?.trim() && (
                        <span 
                          className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: designConfig.hero.ctaColor || storePrimaryColor }}
                        >
                          {pHeroBadge}
                        </span>
                      )}
                      <h4 className="font-black text-sm">{pHeroHeadline}</h4>
                      {pHeroSub?.trim() && (
                        <p className="text-[10px] text-slate-300">{pHeroSub}</p>
                      )}
                      {pHeroCta?.trim() && (
                        <span 
                          className="inline-block text-xs font-black px-4 py-1.5 rounded-lg text-white shadow-xs"
                          style={{ backgroundColor: designConfig.hero.ctaColor || storePrimaryColor }}
                        >
                          {pHeroCta}
                        </span>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="p-2 text-center text-[10px] text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    قسم الواجهة التسويقية (Hero) مخفي حالياً
                  </div>
                );
              })()}

              {/* Scarcity Banner Preview */}
              {(() => {
                const rawStock = getLocalizedText(designConfig.scarcity?.stockText, cmsLang);
                const rawViewers = getLocalizedText(designConfig.scarcity?.viewersText, cmsLang);
                const stockTxt = rawStock ? rawStock.replace('{stock}', String(activeProduct?.stockCount || 5)) : 'طلب مرتفع: بقي 5 قطع';
                const viewersTxt = rawViewers ? rawViewers.replace('{count}', '18') : '18 زائر يتصفحون الآن';

                if ((designConfig.scarcity?.enabled ?? true) && Boolean(rawStock?.trim() || rawViewers?.trim())) {
                  return (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900 flex items-center justify-between">
                      <span className="font-bold">{stockTxt}</span>
                      <span className="text-slate-500">{viewersTxt}</span>
                    </div>
                  );
                }

                return (
                  <div className="p-2 text-center text-[10px] text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    شريط ندرة المخزون والزوار مخفي
                  </div>
                );
              })()}

              {/* Features Preview */}
              {designConfig.features.enabled && designConfig.features.items.length > 0 ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <h5 className="font-bold text-slate-900">{getLocalizedText(designConfig.features.title, cmsLang) || 'المميزات:'}</h5>
                  {designConfig.features.items.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{getLocalizedText(f.title, cmsLang)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 text-center text-[10px] text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  قسم المميزات (Features) مخفي حالياً
                </div>
              )}

              {/* Testimonials Preview */}
              {designConfig.testimonials.enabled && designConfig.testimonials.items.length > 0 ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <h5 className="font-bold text-slate-900">{getLocalizedText(designConfig.testimonials.title, cmsLang) || 'التقييمات:'}</h5>
                  <div className="text-[11px] text-slate-600 space-y-1">
                    {designConfig.testimonials.items.slice(0, 2).map((t, i) => (
                      <div key={i} className="bg-white p-1.5 rounded border border-slate-100 flex items-center justify-between">
                        <span><strong>{getLocalizedText(t.name, cmsLang)}</strong> ({getLocalizedText(t.city, cmsLang)}): &quot;{getLocalizedText(t.comment, cmsLang)}&quot;</span>
                        <span className="text-[10px] font-bold text-emerald-700">
                          {getLocalizedText(designConfig.testimonials.verifiedBadgeText, cmsLang) || 'مشتري مؤكد ✓'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-2 text-center text-[10px] text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  قسم التقييمات (Testimonials) مخفي حالياً
                </div>
              )}

              {/* Guarantee Preview */}
              {(() => {
                const gTitle = getLocalizedText(designConfig.guarantee.title, cmsLang);
                const gDesc = getLocalizedText(designConfig.guarantee.description, cmsLang);
                const gBadge = getLocalizedText(designConfig.guarantee.badgeText, cmsLang);

                if (designConfig.guarantee.enabled && Boolean(gTitle?.trim() || gDesc?.trim())) {
                  return (
                    <div 
                      className="p-3 rounded-xl border text-xs space-y-1"
                      style={{ backgroundColor: `${storePrimaryColor}08`, borderColor: `${storePrimaryColor}30` }}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <ShieldCheck className="w-3.5 h-3.5" style={{ color: storePrimaryColor }} />
                        {gTitle?.trim() && <span>{gTitle}</span>}
                        {gBadge?.trim() && (
                          <span 
                            className="text-[9px] text-white px-1.5 py-0.2 rounded font-bold mr-auto"
                            style={{ backgroundColor: storePrimaryColor }}
                          >
                            {gBadge}
                          </span>
                        )}
                      </div>
                      {gDesc?.trim() && (
                        <p className="text-[10px] text-slate-600">{gDesc}</p>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="p-2 text-center text-[10px] text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    قسم الضمان (Guarantee) مخفي حالياً
                  </div>
                );
              })()}

              {/* Order Form Button & Badges Preview */}
              {(() => {
                const formTitle = getLocalizedText(designConfig.orderForm?.title, cmsLang);
                const submitBtn = getLocalizedText(designConfig.orderForm?.submitButtonText, cmsLang) || 'اضغط هنا للطلب الآن';
                const submitSub = getLocalizedText(designConfig.orderForm?.submitButtonSubtext, cmsLang);

                return (
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                    {formTitle?.trim() && (
                      <div className="p-1.5 rounded text-center text-white text-[10px] font-bold" style={{ backgroundColor: storeSecondaryColor }}>
                        {formTitle}
                      </div>
                    )}
                    <button
                      type="button"
                      className="w-full py-2 rounded-lg text-white font-black text-xs shadow-xs"
                      style={{ backgroundColor: designConfig.orderForm?.submitButtonColor || storePrimaryColor }}
                    >
                      {submitBtn}
                    </button>
                    {submitSub?.trim() && (
                      <p className="text-[9px] text-center text-slate-500">{submitSub}</p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

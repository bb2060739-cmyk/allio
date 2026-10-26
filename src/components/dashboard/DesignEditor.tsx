import React, { useState, useEffect, useRef } from 'react';
import { Store, Product, LandingPageDesignConfig } from '../../types';
import { saveStore, saveProduct, getDefaultDesignConfig } from '../../lib/storage';
import { 
  Palette, Layers, Check, Eye, EyeOff, Plus, Trash2, 
  Sparkles, ShieldCheck, Star, ArrowRight, Loader2, Save,
  Monitor, Smartphone, Store as StoreIcon, Image as ImageIcon, Type,
  Upload, AlertCircle, X
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

  // Active Store & Product objects
  const activeStore = stores.find(s => s.id === selectedStoreId) || stores[0];
  const storeProducts = products.filter(p => p.storeId === activeStore?.id || (!p.storeId && activeStore?.id === 'store-default'));
  const activeProduct = products.find(p => p.id === selectedProductId) || storeProducts[0] || products[0];

  // 1. STORE LEVEL STATE
  const [storePrimaryColor, setStorePrimaryColor] = useState(activeStore?.design?.primaryColor || '#059669');
  const [storeSecondaryColor, setStoreSecondaryColor] = useState(activeStore?.design?.secondaryColor || '#0f172a');
  const [storeLogoType, setStoreLogoType] = useState<'text' | 'image'>(activeStore?.design?.logoType || 'text');
  const [storeLogoText, setStoreLogoText] = useState(activeStore?.design?.logoText || activeStore?.name || 'Allio');
  const [storeLogoImageUrl, setStoreLogoImageUrl] = useState(activeStore?.design?.logoImageUrl || '');
  const [storeAnnouncement, setStoreAnnouncement] = useState(activeStore?.design?.announcementText || 'توصيل مجاني لجميع المدن المغربية 🇲🇦 والدفع نقداً عند الاستلام');

  // Image upload states & refs (1MB limit enforcement)
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
      setStoreAnnouncement(activeStore.design?.announcementText || 'توصيل مجاني لجميع المدن المغربية 🇲🇦 والدفع نقداً عند الاستلام');
    }
  }, [activeStore]);

  // 2. LANDING PAGE LEVEL STATE
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
          announcementText: storeAnnouncement.trim()
        }
      });

      setSaveToast('تم حفظ هوية وألوان المتجر بنجاح في قاعدة بيانات Firestore!');
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

      setSaveToast(`تم حفظ تصميم وأقسام صفحة الهبوط "${activeProduct.name}" بنجاح!`);
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
              محرر التصميم والمحتوى التفاعلي (Design & Content Editor)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            خصص المظهر الكامل على مستويين: هوية المتجر العامة (الألوان والشعار) أو الأقسام التفصيلية لكل صفحة هبوط على حدة مع إمكانية التفعيل والإخفاء بنقرة زر.
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
            <span>مستوى المتجر العام (Store Level)</span>
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
            <span>مستوى صفحات الهبوط (Landing Level)</span>
          </button>
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
                <span>لوحة الألوان الرئيسية (Primary & Secondary Colors)</span>
              </h3>

              {/* Primary Color */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">اللون الأساسي (Primary Color):</span>
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
                  {/* Custom color input */}
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
                  <span className="font-bold text-slate-700">اللون الثانوي / لون النصوص والخلفيات الداكنة:</span>
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

            {/* Logo & Branding */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Type className="w-4 h-4 text-emerald-600" />
                <span>شعار المتجر (Store Logo)</span>
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
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    يظهر هذا النص كشعار رسمي أنيق في رأس صفحة المتجر وصفحات الهبوط.
                  </span>
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
                  {storeLogoImageUrl && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <img src={storeLogoImageUrl} alt="Logo preview" className="h-8 max-w-[120px] object-contain" />
                      <span className="text-[11px] text-slate-500 truncate flex-1">تم حفظ الشعار</span>
                      <button
                        type="button"
                        onClick={() => setStoreLogoImageUrl('')}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                      >
                        إزالة
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Announcement Bar */}
              <div className="pt-3 border-t border-slate-100 space-y-1">
                <label className="text-xs font-bold text-slate-700 block">شريط الإعلانات العلوي (Announcement Bar):</label>
                <input
                  type="text"
                  value={storeAnnouncement}
                  onChange={(e) => setStoreAnnouncement(e.target.value)}
                  placeholder="توصيل مجاني لجميع المدن المغربية 🇲🇦 والدفع عند الاستلام"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white"
                />
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
                <span>حفظ هوية وتصميم المتجر (Save Store Branding)</span>
              </button>
            </div>
          </div>

          {/* Interactive Live Preview (lg:col-span-5) */}
          <div className="lg:col-span-5 sticky top-20 space-y-4">
            <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>معاينة حية للمتجر (Live Header & CTA Preview)</span>
              </span>
              <span className="text-[10px] text-slate-400">تحديث فوري</span>
            </div>

            {/* Mock Header Preview */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
              {/* Mock Announcement */}
              <div 
                className="py-1.5 px-3 text-center text-[10px] text-white font-bold transition-colors"
                style={{ backgroundColor: storeSecondaryColor }}
              >
                {storeAnnouncement}
              </div>

              {/* Mock Navbar */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  {storeLogoType === 'image' && storeLogoImageUrl ? (
                    <img src={storeLogoImageUrl} alt="Logo" className="h-7 w-auto object-contain" />
                  ) : (
                    <span className="text-xl font-black transition-colors" style={{ color: storePrimaryColor }}>
                      {storeLogoText || 'Allio'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">
                    {activeStore?.niche || 'عام'}
                  </span>
                </div>
              </div>

              {/* Sample Button Preview */}
              <div className="p-6 bg-slate-50 space-y-4 text-center">
                <p className="text-xs text-slate-600 font-semibold">
                  شكل الأزرار والعناصر التفاعلية باللون المختار:
                </p>

                <button
                  type="button"
                  className="w-full py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: storePrimaryColor }}
                >
                  <span>اطلب الآن - الدفع عند الاستلام 🚚</span>
                </button>

                <div className="flex items-center justify-center gap-2">
                  <span 
                    className="text-[11px] font-bold px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${storePrimaryColor}15`, color: storePrimaryColor }}
                  >
                    عرض حصري بالمغرب 🔥
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* LEVEL 2: LANDING PAGE LEVEL SECTION BUILDER */}
      {/* ===================================================================== */}
      {editorLevel === 'landing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Form (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Landing Page Picker */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">اختر صفحة الهبوط لتعديل محتواها وأقسامها:</label>
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
                      {p.name} ({p.price} DH) - [متجر: {linkedStore?.name || 'الرئيسي'}]
                    </option>
                  );
                })}
              </select>
            </div>

            {/* SECTION 1: HERO */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">1. قسم الواجهة التسويقية (Hero Section)</h3>
                </div>

                {/* Show/Hide Toggle */}
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
                      value={designConfig.hero.badgeText || ''}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        hero: { ...designConfig.hero, badgeText: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">العنوان الرئيسي (Headline):</label>
                    <input
                      type="text"
                      value={designConfig.hero.headline || ''}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        hero: { ...designConfig.hero, headline: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">الوصف الفرعي (Subheadline):</label>
                    <textarea
                      rows={2}
                      value={designConfig.hero.subheadline || ''}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        hero: { ...designConfig.hero, subheadline: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">نص زر الطلب (CTA Button):</label>
                      <input
                        type="text"
                        value={designConfig.hero.ctaText || ''}
                        onChange={(e) => setDesignConfig({
                          ...designConfig,
                          hero: { ...designConfig.hero, ctaText: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">صورة الواجهة (اختياري - ≤ 1MB):</label>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="اتركه فارغاً لاستخدام صور المنتج"
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
                </div>
              )}
            </div>

            {/* SECTION 2: FEATURES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">2. قسم المميزات والمواصفات (Features Section)</h3>
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
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">عنوان قسم المميزات:</label>
                    <input
                      type="text"
                      value={designConfig.features.title || ''}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        features: { ...designConfig.features, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                    />
                  </div>

                  {/* Features List */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 block">نقاط المميزات:</label>
                    {designConfig.features.items.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...designConfig.features.items];
                            updated[idx].title = e.target.value;
                            setDesignConfig({
                              ...designConfig,
                              features: { ...designConfig.features, items: updated }
                            });
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = designConfig.features.items.filter((_, i) => i !== idx);
                            setDesignConfig({
                              ...designConfig,
                              features: { ...designConfig.features, items: updated }
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
                        const newFeature = { id: 'f-' + Date.now(), title: 'ميزة إضافية جديدة' };
                        setDesignConfig({
                          ...designConfig,
                          features: {
                            ...designConfig.features,
                            items: [...designConfig.features.items, newFeature]
                          }
                        });
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer mt-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ إضافة ميزة جديدة</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: TESTIMONIALS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <h3 className="font-bold text-sm text-slate-900">3. قسم آراء وتقييمات الزبائن (Testimonials Section)</h3>
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
                    <label className="font-bold text-slate-700 block mb-1">عنوان قسم الآراء:</label>
                    <input
                      type="text"
                      value={designConfig.testimonials.title || ''}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        testimonials: { ...designConfig.testimonials, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                    />
                  </div>

                  {/* Testimonial Cards Editor */}
                  <div className="space-y-3">
                    {designConfig.testimonials.items.map((test, idx) => (
                      <div key={test.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 relative group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={test.name}
                              onChange={(e) => {
                                const updated = [...designConfig.testimonials.items];
                                updated[idx].name = e.target.value;
                                setDesignConfig({ ...designConfig, testimonials: { ...designConfig.testimonials, items: updated } });
                              }}
                              placeholder="اسم الزبون"
                              className="px-2 py-1 rounded border border-slate-200 bg-white font-bold text-xs"
                            />
                            <input
                              type="text"
                              value={test.city}
                              onChange={(e) => {
                                const updated = [...designConfig.testimonials.items];
                                updated[idx].city = e.target.value;
                                setDesignConfig({ ...designConfig, testimonials: { ...designConfig.testimonials, items: updated } });
                              }}
                              placeholder="المدينة"
                              className="px-2 py-1 rounded border border-slate-200 bg-white text-xs w-28"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = designConfig.testimonials.items.filter((_, i) => i !== idx);
                              setDesignConfig({ ...designConfig, testimonials: { ...designConfig.testimonials, items: updated } });
                            }}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={test.comment}
                          onChange={(e) => {
                            const updated = [...designConfig.testimonials.items];
                            updated[idx].comment = e.target.value;
                            setDesignConfig({ ...designConfig, testimonials: { ...designConfig.testimonials, items: updated } });
                          }}
                          placeholder="رأي الزبون في المنتج والتوصيل..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newTestimonial = {
                          id: 't-' + Date.now(),
                          name: 'زبون جديد',
                          city: 'الدار البيضاء',
                          rating: 5,
                          comment: 'منتج رائع وتوصيل سريع في الموعد المحدد.'
                        };
                        setDesignConfig({
                          ...designConfig,
                          testimonials: {
                            ...designConfig.testimonials,
                            items: [...designConfig.testimonials.items, newTestimonial]
                          }
                        });
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ إضافة رأي زبون جديد</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: GUARANTEE */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">4. قسم الضمان وثقة الزبون (Guarantee Section)</h3>
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
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">عنوان الضمان:</label>
                    <input
                      type="text"
                      value={designConfig.guarantee.title || ''}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        guarantee: { ...designConfig.guarantee, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">تفاصيل الضمان وسياسة المعاينة قبل الدفع:</label>
                    <textarea
                      rows={2}
                      value={designConfig.guarantee.description || ''}
                      onChange={(e) => setDesignConfig({
                        ...designConfig,
                        guarantee: { ...designConfig.guarantee, description: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs leading-relaxed"
                    />
                  </div>
                </div>
              )}
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
                <span>حفظ محتوى وأقسام صفحة الهبوط (Save Sections)</span>
              </button>
            </div>
          </div>

          {/* Real-time Preview Drawer (lg:col-span-5) */}
          <div className="lg:col-span-5 sticky top-20 space-y-4">
            <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>معاينة حية لأقسام الصفحة (Live Sections Preview)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Real-time</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 space-y-4 max-h-[750px] overflow-y-auto">
              {/* Hero Preview */}
              {designConfig.hero.enabled ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                    {designConfig.hero.badgeText}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900">{designConfig.hero.headline}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{designConfig.hero.subheadline}</p>
                  <button 
                    type="button"
                    className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg mt-2 shadow-xs"
                    style={{ backgroundColor: storePrimaryColor }}
                  >
                    {designConfig.hero.ctaText}
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  قسم الواجهة (Hero) مخفي حالياً
                </div>
              )}

              {/* Features Preview */}
              {designConfig.features.enabled ? (
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                  <h5 className="font-bold text-xs text-slate-900">{designConfig.features.title}</h5>
                  <div className="space-y-1.5">
                    {designConfig.features.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  قسم المميزات (Features) مخفي حالياً
                </div>
              )}

              {/* Testimonials Preview */}
              {designConfig.testimonials.enabled ? (
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5">
                  <h5 className="font-bold text-xs text-slate-900">{designConfig.testimonials.title}</h5>
                  <div className="space-y-2">
                    {designConfig.testimonials.items.slice(0, 2).map((t) => (
                      <div key={t.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{t.name} ({t.city})</span>
                          <div className="flex text-amber-400">
                            {[...Array(t.rating || 5)].map((_, i) => (
                              <Star key={i} className="w-2.5 h-2.5 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{t.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  قسم التقييمات (Testimonials) مخفي حالياً
                </div>
              )}

              {/* Guarantee Preview */}
              {designConfig.guarantee.enabled && (
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{designConfig.guarantee.title}</span>
                  </div>
                  <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                    {designConfig.guarantee.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

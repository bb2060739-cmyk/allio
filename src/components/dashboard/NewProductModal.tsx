import React, { useState, useEffect, useRef } from 'react';
import { Product, Store, LocalizedString, SupportedLanguage } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import { LocalizedInput, LocalizedTextarea } from '../admin/LocalizedFields';
import { X, Plus, Trash2, Sparkles, Tag, Shield, Globe, Store as StoreIcon, Upload, AlertCircle, Loader2, Languages } from 'lucide-react';
import { validateImageFile, processAndCompressImage, MAX_IMAGE_SIZE_MB } from '../../lib/imageOptimization';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product> & { name: LocalizedString; price: number }) => void | Promise<void>;
  editingProduct?: Product | null;
  stores?: Store[];
}

export const NewProductModal: React.FC<NewProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduct,
  stores = []
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeLangTab, setActiveLangTab] = useState<SupportedLanguage>('ar');
  const [storeId, setStoreId] = useState<string>('store-default');
  
  // Multilingual states stored as Record<SupportedLanguage, string>
  const [name, setName] = useState<Record<SupportedLanguage, string>>({ ar: '', en: '', fr: '', es: '' });
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState<number | ''>(299);
  const [originalPrice, setOriginalPrice] = useState<number | ''>(499);
  const [shortDescription, setShortDescription] = useState<Record<SupportedLanguage, string>>({ ar: '', en: '', fr: '', es: '' });
  const [fullDescription, setFullDescription] = useState<Record<SupportedLanguage, string>>({ ar: '', en: '', fr: '', es: '' });
  const [features, setFeatures] = useState<string[]>(['']);
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [badge, setBadge] = useState<Record<SupportedLanguage, string>>({ ar: 'عرض خاص بالمغرب 🔥', en: 'Special Offer 🔥', fr: 'Offre Spéciale 🔥', es: 'Oferta Especial 🔥' });
  const [stockCount, setStockCount] = useState<number>(15);
  const [fbPixelId, setFbPixelId] = useState('');
  const [tiktokPixelId, setTiktokPixelId] = useState('');
  const [freeShipping, setFreeShipping] = useState(true);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const normalizeToMap = (val: LocalizedString | undefined, defaultAr = ''): Record<SupportedLanguage, string> => {
    if (!val) return { ar: defaultAr, en: '', fr: '', es: '' };
    if (typeof val === 'string') return { ar: val, en: '', fr: '', es: '' };
    return {
      ar: val.ar || defaultAr,
      en: val.en || '',
      fr: val.fr || '',
      es: val.es || '',
    };
  };

  useEffect(() => {
    if (editingProduct) {
      setStoreId(editingProduct.storeId || stores[0]?.id || 'store-default');
      setName(normalizeToMap(editingProduct.name));
      setSlug(editingProduct.slug);
      setPrice(editingProduct.price);
      setOriginalPrice(editingProduct.originalPrice || '');
      setShortDescription(normalizeToMap(editingProduct.shortDescription));
      setFullDescription(normalizeToMap(editingProduct.fullDescription));
      setFeatures(editingProduct.features.length > 0 ? editingProduct.features.map(f => typeof f === 'string' ? f : (f.ar || Object.values(f)[0] || '')) : ['']);
      setImages(editingProduct.images || []);
      setBadge(normalizeToMap(editingProduct.badge, 'عرض خاص بالمغرب 🔥'));
      setStockCount(editingProduct.stockCount || 10);
      setFbPixelId(editingProduct.fbPixelId || '');
      setTiktokPixelId(editingProduct.tiktokPixelId || '');
      setFreeShipping(editingProduct.freeShipping !== false);
    } else {
      // Defaults for a new Moroccan COD landing page
      setName({
        ar: '',
        en: '',
        fr: '',
        es: '',
      });
      setSlug('');
      setPrice(299);
      setOriginalPrice(499);
      setShortDescription({
        ar: 'منتج عالي الجودة متوفر حصرياً مع خدمة الدفع عند الاستلام والتوصيل بالمجان.',
        en: 'High quality product available exclusively with cash on delivery and free shipping.',
        fr: 'Produit de haute qualité disponible exclusivement avec paiement à la livraison et livraison gratuite.',
        es: 'Producto de alta calidad disponible exclusivamente con pago contra entrega y envío gratuito.'
      });
      setFullDescription({
        ar: 'مواصفات وتفاصيل المنتج الشاملة لضمان أفضل تجربة استخدام.',
        en: 'Comprehensive product specifications and details to ensure the best experience.',
        fr: 'Spécifications complètes du produit pour garantir la meilleure expérience.',
        es: 'Especificaciones completas del producto para garantizar la mejor experiencia.'
      });
      setFeatures([
        'جودة ممتازة معتمدة ومضمونة 100%',
        'توصيل سريع إلى باب المنزل في جميع مدن المغرب',
        'الدفع عند الاستلام بعد فحص المنتج والتأكد منه',
        'ضمان الاستبدال أو الاسترجاع لمدة 14 يوماً'
      ]);
      setImages([
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'
      ]);
      setBadge({
        ar: 'توصيل مجاني 🇲🇦',
        en: 'Free Shipping 🇲🇦',
        fr: 'Livraison Gratuite 🇲🇦',
        es: 'Envío Gratis 🇲🇦'
      });
      setStockCount(12);
      setFbPixelId('');
      setTiktokPixelId('');
      setFreeShipping(true);
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  // Auto-generate clean slug from product name if slug is empty or user is adding new
  const handleNameChange = (valMap: Record<SupportedLanguage, string>) => {
    setName(valMap);
    if (!editingProduct && !slug) {
      const activeText = valMap.en || valMap.fr || valMap.ar || '';
      if (activeText) {
        const generated = activeText
          .trim()
          .toLowerCase()
          .replace(/[^\w\u0621-\u064A\s-]/g, '')
          .replace(/\s+/g, '-');
        setSlug(generated);
      }
    }
  };

  const handleAddFeature = () => {
    setFeatures([...features, '']);
  };

  const handleFeatureChange = (index: number, val: string) => {
    const updated = [...features];
    updated[index] = val;
    setFeatures(updated);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploadError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setImageUploadError(validation.error || `حجم الصورة يتجاوز الحد الأقصى المسموح به (${MAX_IMAGE_SIZE_MB} ميغابايت).`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsProcessingImage(true);
      const { dataUrl } = await processAndCompressImage(file);
      setImages(prev => [...prev, dataUrl]);
    } catch (err) {
      setImageUploadError(err instanceof Error ? err.message : 'فشل معالجة ورفع الصورة');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setImageUploadError(null);
      if (imageUrl.startsWith('data:image') && imageUrl.length > 1.37 * 1024 * 1024) {
        setImageUploadError('بيانات الصورة المدخلة تتجاوز 1 ميغابايت. يرجى اختيار صورة أصغر حجماً.');
        return;
      }
      setImages([...images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryName = name.ar || name.en || name.fr || name.es || '';
    if (!primaryName.trim() || !price) return;

    await onSave({
      id: editingProduct?.id,
      storeId,
      name, // Saved as nested { ar, en, fr, es } within same doc
      slug: slug.trim() || 'product-' + Date.now(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      shortDescription,
      fullDescription,
      features: features.filter(f => f.trim().length > 0),
      images: images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'
      ],
      badge,
      stockCount: Number(stockCount) || 10,
      fbPixelId: fbPixelId.trim(),
      tiktokPixelId: tiktokPixelId.trim(),
      freeShipping
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-800">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-20">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">
                {editingProduct ? 'تعديل صفحة المنتج' : 'إنشاء صفحة منتج جديدة (Landing Page)'}
              </h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                i18n مفعّل
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              صفحة هبوط مع دعم اللغات المتعددة (عربي، إنجليزي، فرنسي، إسباني) داخل نفس وثيقة Firestore
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Language Switcher Bar */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Languages className="w-4 h-4 text-emerald-600" />
            <span>تبويب اللغة السريع للحقول:</span>
          </div>
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs gap-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = activeLangTab === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setActiveLangTab(lang.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section: Store & Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>1. المتجر وبيانات المنتج (بالدرهم المغربي DH)</span>
            </h3>

            {/* Store / Niche selector */}
            {stores && stores.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المتجر / النيش التابع له <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <StoreIcon className="w-4 h-4" />
                  </div>
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white outline-none cursor-pointer"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.niche})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Localized Name */}
            <LocalizedInput
              label="اسم المنتج التجاري"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="مثال: ساعة ذكية Ultra Max Titanium الأصلية"
              activeLanguage={activeLangTab}
              onLanguageChange={setActiveLangTab}
              helpText="أدخل اسم المنتج باللغات المرغوبة. يتم عرض اللغة المناسبة للمشتري تلقائياً."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سعر البيع للزبون (درهم مغربي DH) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="299"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 text-sm outline-none font-bold"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    DH
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  السعر القديم قبل الخصم (درهم DH)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="499"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 text-sm outline-none"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    DH
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الرابط الفريد لصفحة الهبوط (Unique URL):
                </label>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500" dir="ltr">
                  <span className="text-emerald-700 font-bold">allio.shop/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="product-1"
                    className="flex-1 bg-transparent border-0 outline-none font-mono text-slate-800 font-semibold"
                  />
                </div>
              </div>

              {/* Localized Badge */}
              <LocalizedInput
                label="شارة العرض (Badge)"
                value={badge}
                onChange={setBadge}
                placeholder="عرض خاص بالمغرب 🔥"
                activeLanguage={activeLangTab}
                onLanguageChange={setActiveLangTab}
              />
            </div>

            {/* Localized Short Description */}
            <LocalizedTextarea
              label="الوصف التسويقي المختصر"
              rows={2}
              value={shortDescription}
              onChange={setShortDescription}
              placeholder="وصف مشوق وسريع يظهر في أعلى صفحة الهبوط..."
              activeLanguage={activeLangTab}
              onLanguageChange={setActiveLangTab}
            />

            {/* Localized Full Description */}
            <LocalizedTextarea
              label="الوصف الكامل والمواصفات"
              rows={3}
              value={fullDescription}
              onChange={setFullDescription}
              placeholder="تفاصيل العرض، طريقة الاستخدام، والمميزات..."
              activeLanguage={activeLangTab}
              onLanguageChange={setActiveLangTab}
            />
          </div>

          {/* Section: Features list */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                مميزات المنتج (نقاط إبراز القيمة)
              </label>
              <button
                type="button"
                onClick={handleAddFeature}
                className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> إضافة ميزة
              </button>
            </div>

            <div className="space-y-2">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    placeholder={`ميزة رقم ${idx + 1}...`}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
                  />
                  {features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section: Images & Media */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                صور المنتج (مع حد أقصى 1 ميغابايت لكل صورة لحماية الحصة المجانية)
              </label>
              <span className="text-[11px] text-slate-400">
                {images.length} صورة مضافة
              </span>
            </div>

            {imageUploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{imageUploadError}</span>
              </div>
            )}

            {/* Direct Upload button */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>جاري ضغط وضبط حجم الصورة...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>رفع صورة من الجهاز (أقصى حد 1MB)</span>
                  </>
                )}
              </button>

              <span className="text-xs text-slate-400">أو أدخل رابط ويب:</span>

              <div className="flex-1 flex items-center gap-1.5 w-full">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إضافة
                </button>
              </div>
            </div>

            {/* Image Preview Gallery */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-square flex items-center justify-center p-1">
                    <img src={img} alt="" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 end-1 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Pixels & Tracking */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>2. تتبع الحملات الإعلانية (Pixels)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Facebook Pixel ID
                </label>
                <input
                  type="text"
                  value={fbPixelId}
                  onChange={(e) => setFbPixelId(e.target.value)}
                  placeholder="مثال: 123456789012345"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none font-mono focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  TikTok Pixel ID
                </label>
                <input
                  type="text"
                  value={tiktokPixelId}
                  onChange={(e) => setTiktokPixelId(e.target.value)}
                  placeholder="مثال: C6ABCD1234EFG567"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none font-mono focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{editingProduct ? 'حفظ التعديلات' : 'إنشاء وحفظ المنتج'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

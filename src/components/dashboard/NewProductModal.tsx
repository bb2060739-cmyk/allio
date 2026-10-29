import React, { useState, useEffect, useRef } from 'react';
import { Product, Store, LocalizedString } from '../../types';
import { getLocalizedText } from '../../utils/i18n';
import { X, Plus, Trash2, Tag, Store as StoreIcon, Upload, AlertCircle, Loader2 } from 'lucide-react';
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
  const [storeId, setStoreId] = useState<string>('store-default');
  
  // Clean, lightweight single-language strings (auto-translated on frontend via DOM)
  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState<number | ''>(299);
  const [originalPrice, setOriginalPrice] = useState<number | ''>(499);
  const [shortDescription, setShortDescription] = useState<string>('');
  const [fullDescription, setFullDescription] = useState<string>('');
  const [features, setFeatures] = useState<string[]>(['']);
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [badge, setBadge] = useState<string>('عرض خاص بالمغرب 🔥');
  const [stockCount, setStockCount] = useState<number>(15);
  const [fbPixelId, setFbPixelId] = useState('');
  const [tiktokPixelId, setTiktokPixelId] = useState('');
  const [freeShipping, setFreeShipping] = useState(true);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setStoreId(editingProduct.storeId || stores[0]?.id || 'store-default');
      setName(getLocalizedText(editingProduct.name));
      setSlug(editingProduct.slug || '');
      setPrice(editingProduct.price);
      setOriginalPrice(editingProduct.originalPrice || '');
      setShortDescription(getLocalizedText(editingProduct.shortDescription));
      setFullDescription(getLocalizedText(editingProduct.fullDescription));
      setFeatures(
        editingProduct.features && editingProduct.features.length > 0 
          ? editingProduct.features.map(f => getLocalizedText(f)) 
          : ['']
      );
      setImages(editingProduct.images || []);
      setBadge(getLocalizedText(editingProduct.badge, 'ar', 'عرض خاص بالمغرب 🔥'));
      setStockCount(editingProduct.stockCount || 10);
      setFbPixelId(editingProduct.fbPixelId || '');
      setTiktokPixelId(editingProduct.tiktokPixelId || '');
      setFreeShipping(editingProduct.freeShipping !== false);
    } else {
      // Defaults for a new Moroccan COD landing page
      setName('');
      setSlug('');
      setPrice(299);
      setOriginalPrice(499);
      setShortDescription('منتج عالي الجودة متوفر حصرياً مع خدمة الدفع عند الاستلام والتوصيل بالمجان.');
      setFullDescription('مواصفات وتفاصيل المنتج الشاملة لضمان أفضل تجربة استخدام.');
      setFeatures([
        'جودة ممتازة معتمدة ومضمونة 100%',
        'توصيل سريع إلى باب المنزل في جميع مدن المغرب',
        'الدفع عند الاستلام بعد فحص المنتج والتأكد منه',
        'ضمان الاستبدال أو الاسترجاع لمدة 14 يوماً'
      ]);
      setImages([
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'
      ]);
      setBadge('توصيل مجاني 🇲🇦');
      setStockCount(12);
      setFbPixelId('');
      setTiktokPixelId('');
      setFreeShipping(true);
    }
  }, [editingProduct, isOpen, stores]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingProduct && !slug && val) {
      const generated = val
        .trim()
        .toLowerCase()
        .replace(/[^\w\u0621-\u064A\s-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generated);
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    setIsSubmitting(true);
    setSaveError(null);

    try {
      await onSave({
        id: editingProduct?.id,
        storeId,
        name: name.trim(), // Stored as lightweight single string
        slug: slug.trim() || 'product-' + Date.now(),
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        shortDescription: shortDescription.trim(),
        fullDescription: fullDescription.trim(),
        features: features.filter(f => f.trim().length > 0),
        images: images.length > 0 ? images : [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'
        ],
        badge: badge.trim(),
        stockCount: Number(stockCount) || 10,
        fbPixelId: fbPixelId.trim(),
        tiktokPixelId: tiktokPixelId.trim(),
        freeShipping
      });
      onClose();
    } catch (err) {
      console.error('[NewProductModal] Failed to persist product to Firestore:', err);
      setSaveError(err instanceof Error ? err.message : 'فشل حفظ صفحة الهبوط في Firebase. المرجو المحاولة مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
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
                ترجمة تلقائية مدمجة ⚡
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              بيانات خفيفة ومحسنة لقواعد البيانات مع ترجمة DOM تلقائية فورية دون مضاعفة الاستهلاك
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
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

            {/* Product Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم المنتج التجاري <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="مثال: ساعة ذكية Ultra Max Titanium الأصلية"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 text-sm outline-none font-bold"
              />
            </div>

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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  شارة العرض (Badge):
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="عرض خاص بالمغرب 🔥"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الوصف التسويقي المختصر:
              </label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="وصف مشوق وسريع يظهر في أعلى صفحة الهبوط..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-600 outline-none leading-relaxed"
              />
            </div>

            {/* Full Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الوصف الكامل والمواصفات:
              </label>
              <textarea
                rows={3}
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="تفاصيل العرض، طريقة الاستخدام، والمميزات..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-600 outline-none leading-relaxed"
              />
            </div>
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
                صور المنتج (حافظ على نسب الأبعاد الأصلية دون قص)
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                حد أقصى للرفع: 1 ميغابايت (1MB Max)
              </span>
            </div>

            {imageUploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{imageUploadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setImageUploadError(null)}
                  className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <div className="flex-1 flex gap-2 min-w-[200px]">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... أو رابط مباشر للصورة"
                  className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-emerald-500 font-mono"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  إضافة رابط
                </button>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isProcessingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري المعالجة...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع من الجهاز (أقل من 1MB)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-1 flex items-center justify-center min-h-[90px]">
                    <img
                      src={img}
                      alt={`Product image ${idx + 1}`}
                      className="max-h-24 w-auto h-auto object-contain rounded-lg transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                      title="حذف الصورة"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        رئيسية
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Stock & Tracking Pixels */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              3. المخزون وبكسلات التتبع (Facebook & TikTok Pixel)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  العدد المتبقي في المخزون (لعنصر الندرة Scarcity):
                </label>
                <input
                  type="number"
                  min={1}
                  value={stockCount}
                  onChange={(e) => setStockCount(Number(e.target.value))}
                  className="w-full px-4 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="freeShippingModal"
                  checked={freeShipping}
                  onChange={(e) => setFreeShipping(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="freeShippingModal" className="text-xs font-bold text-slate-700 cursor-pointer">
                  توصيل مجاني 0 درهم لجميع المدن (Free Shipping)
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  معرّف بكسل فيسبوك (Facebook Pixel ID):
                </label>
                <input
                  type="text"
                  value={fbPixelId}
                  onChange={(e) => setFbPixelId(e.target.value)}
                  placeholder="مثال: 123456789012345"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-emerald-500 font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  معرّف بكسل تيك توك (TikTok Pixel ID):
                </label>
                <input
                  type="text"
                  value={tiktokPixelId}
                  onChange={(e) => setTiktokPixelId(e.target.value)}
                  placeholder="مثال: C6A7B8C9D0E1F2"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-emerald-500 font-mono"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Save Error Alert */}
          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الحفظ في Firebase...</span>
                </>
              ) : (
                <span>{editingProduct ? 'حفظ التعديلات' : 'نشر صفحة المنتج الآن'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { X, Plus, Trash2, Sparkles, Tag, Shield, Globe } from 'lucide-react';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product> & { name: string; price: number }) => void | Promise<void>;
  editingProduct?: Product | null;
}

export const NewProductModal: React.FC<NewProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduct
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState<number | ''>(299);
  const [originalPrice, setOriginalPrice] = useState<number | ''>(499);
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [features, setFeatures] = useState<string[]>(['']);
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [badge, setBadge] = useState('عرض خاص بالمغرب 🔥');
  const [stockCount, setStockCount] = useState<number>(15);
  const [fbPixelId, setFbPixelId] = useState('');
  const [tiktokPixelId, setTiktokPixelId] = useState('');
  const [freeShipping, setFreeShipping] = useState(true);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setSlug(editingProduct.slug);
      setPrice(editingProduct.price);
      setOriginalPrice(editingProduct.originalPrice || '');
      setShortDescription(editingProduct.shortDescription || '');
      setFullDescription(editingProduct.fullDescription || '');
      setFeatures(editingProduct.features.length > 0 ? editingProduct.features : ['']);
      setImages(editingProduct.images || []);
      setBadge(editingProduct.badge || '');
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
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  // Handle auto-generating clean slug from product name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingProduct) {
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

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setImages([...images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    await onSave({
      id: editingProduct?.id,
      name: name.trim(),
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-800">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {editingProduct ? 'تعديل صفحة المنتج' : 'إنشاء صفحة منتج جديدة (Landing Page)'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              أنشئ صفحة هبوط سريعة جداً مع بيكسل فيسبوك وتيك توك واستمارة COD مخصصة للمغرب
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section: Product Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>1. بيانات المنتج والأسعار (بالدرهم المغربي DH)</span>
            </h3>

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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm outline-none"
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
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  يمكنك تخصيص الرابط مثل: watch-1 أو argan-bio
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  شارات الثقة (Badge):
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="مثال: الأكثر مبيعاً بالمغرب 🔥"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الوصف التسويقي المختصر
              </label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="وصف مشوق وسريع يظهر في أعلى صفحة الهبوط..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none resize-none"
              />
            </div>
          </div>

          {/* Section: Features list */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>2. مميزات وفوائد المنتج (Bullet Points)</span>
              </label>
              <button
                type="button"
                onClick={handleAddFeature}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة ميزة</span>
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
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500"
                  />
                  {features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section: Product Images */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <label className="block text-sm font-bold text-slate-900">
              3. صور المنتج (روابط الصور)
            </label>

            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="أدخل رابط صورة المنتج (URL)..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shrink-0"
              >
                إضافة صورة
              </button>
            </div>

            {/* Images preview strip */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {images.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group">
                    <img src={img} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Tracking Pixels (Crucial for Moroccan COD) */}
          <div className="space-y-4 pt-4 border-t border-slate-200 bg-slate-50 -mx-6 px-6 py-5 rounded-b-3xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>4. تتبع الحملات الإعلانية (Tracking Pixels)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                يتم تفعيل البيكسل تلقائياً في صفحة المنتج وصفحة الشكر لإرسال أحداث ViewContent و InitiateCheckout و Purchase
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Facebook Pixel */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Facebook Pixel ID:
                  </label>
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                    Meta Ads
                  </span>
                </div>
                <input
                  type="text"
                  dir="ltr"
                  value={fbPixelId}
                  onChange={(e) => setFbPixelId(e.target.value)}
                  placeholder="مثال: 109823471629831"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 block">
                  ستُرسل أحداث الشراء مع عملة MAD والقيمة بالدرهم
                </span>
              </div>

              {/* TikTok Pixel */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    TikTok Pixel ID:
                  </label>
                  <span className="text-[10px] bg-black text-white font-bold px-1.5 py-0.5 rounded">
                    TikTok Ads
                  </span>
                </div>
                <input
                  type="text"
                  dir="ltr"
                  value={tiktokPixelId}
                  onChange={(e) => setTiktokPixelId(e.target.value)}
                  placeholder="مثال: C7HG98LKQ0192"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-slate-800"
                />
                <span className="text-[10px] text-slate-400 block">
                  تتبع أوتوماتيكي لحدث CompletePayment بعد التأكيد
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>{editingProduct ? 'حفظ التعديلات' : 'إنشاء ونشر صفحة الهبوط فوراً'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Product } from '../../types';
import { deleteProduct } from '../../lib/storage';
import { 
  Plus, ExternalLink, Edit3, Trash2, Copy, 
  Check, Eye, ShoppingCart, Globe, Tag 
} from 'lucide-react';

interface LandingPagesManagerProps {
  products: Product[];
  onProductsChange: () => void;
  onOpenCreateModal: () => void;
  onEditProduct: (product: Product) => void;
  onViewLandingPage: (product: Product) => void;
}

export const LandingPagesManager: React.FC<LandingPagesManagerProps> = ({
  products,
  onProductsChange,
  onOpenCreateModal,
  onEditProduct,
  onViewLandingPage
}) => {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف صفحة الهبوط "${name}"؟`)) {
      deleteProduct(id);
      onProductsChange();
    }
  };

  const handleCopyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            صفحات الهبوط المباشرة (Landing Pages)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            صفحات فائقة السرعة مجهزة باستمارة COD المغرب وربط البيكسل
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء صفحة منتج جديدة</span>
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((product) => {
          const convRate = product.views > 0
            ? ((product.salesCount / product.views) * 100).toFixed(1)
            : '0.0';

          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image Cover */}
                <div className="relative aspect-16/9 bg-slate-100 overflow-hidden">
                  <img
                    src={product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {product.badge && (
                    <span className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {product.badge}
                    </span>
                  )}
                  <span className="absolute bottom-2.5 left-2.5 bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-xs">
                    {product.price} درهم DH
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {product.shortDescription}
                    </p>
                  </div>

                  {/* Public Link Bar */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-slate-400 font-medium">الرابط الفريد لصفحة الهبوط:</span>
                      <span className="font-mono text-xs font-bold text-emerald-800 truncate" dir="ltr">
                        allio.shop/{product.slug}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopyLink(product.slug)}
                        title="نسخ الرابط المباشر للحملة"
                        className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-all flex items-center gap-1 text-[11px] font-bold"
                      >
                        {copiedSlug === product.slug ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Pixels Status */}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                      product.fbPixelId
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      <span>FB Pixel:</span>
                      <strong>{product.fbPixelId ? 'مربوط ✓' : 'غير مفعل'}</strong>
                    </span>

                    <span className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                      product.tiktokPixelId
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      <span>TikTok:</span>
                      <strong>{product.tiktokPixelId ? 'مربوط ✓' : 'غير مفعل'}</strong>
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">الزيارات</span>
                      <span className="font-bold text-slate-800">{product.views}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">المبيعات</span>
                      <span className="font-bold text-emerald-700">{product.salesCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">معدل التحويل</span>
                      <span className="font-bold text-slate-800">{convRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onViewLandingPage(product)}
                  className="flex-1 py-1.5 px-3 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>معاينة الصفحة</span>
                </button>

                <button
                  onClick={() => onEditProduct(product)}
                  title="تعديل صفحة المنتج"
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(product.id, product.name)}
                  title="حذف الصفحة"
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

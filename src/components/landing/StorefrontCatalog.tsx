import React from 'react';
import { Product } from '../../types';
import { Truck, ShieldCheck, RefreshCw, ShoppingBag, ArrowLeft, Star, Sparkles } from 'lucide-react';

interface StorefrontCatalogProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onOpenDashboard: () => void;
}

export const StorefrontCatalog: React.FC<StorefrontCatalogProps> = ({
  products,
  onSelectProduct,
  onOpenDashboard
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>عروض التجارة الإلكترونية والدفع عند الاستلام بالمغرب - توصيل مجاني وسريع 🇲🇦</span>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-600 font-sans tracking-tight">
              allio<span className="text-slate-900">.shop</span>
            </span>
          </div>

          <button
            onClick={onOpenDashboard}
            className="text-xs px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors"
          >
            لوحة تحكم التاجر (Dashboard)
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/60 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
            <span>منصة الدفع عند الاستلام في المغرب</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            منتجات مختارة بعناية، توصيل مجاني إلى باب منزلك
          </h1>
          <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto">
            لا داعي للدفع بالبطاقة البنكية مسبقاً. اطلب الآن، تفقد طلبيتك وافحصها مع الموزع، ثم ادفع نقداً بكل راحة وأمان.
          </p>

          {/* 3 Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 max-w-3xl mx-auto text-right">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-xs text-slate-900">توصيل مجاني 0 درهم</h2>
                <p className="text-[11px] text-slate-500">لكافة المدن والقرى المغربية</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-xs text-slate-900">الدفع بعد المعاينة</h2>
                <p className="text-[11px] text-slate-500">افحص جودة منتجك أولاً</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-xs text-slate-900">ضمان 14 يوماً</h2>
                <p className="text-[11px] text-slate-500">استبدال أو استرجاع بدون تعقيد</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Grid */}
      <main className="max-w-6xl mx-auto px-4 pt-10 space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-900">العروض المتوفرة اليوم</h2>
          <p className="text-xs text-slate-500 mt-0.5">انقر على أي منتج لفتح صفحة الهبوط واستمارة الطلب المباشرة</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const originalPrice = product.originalPrice || Math.round(product.price * 1.6);
            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.badge && (
                      <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {product.shortDescription}
                    </p>

                    <div className="flex items-center gap-1 text-amber-500 text-xs">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="font-bold text-slate-700 mr-1">4.9</span>
                      <span className="text-slate-400">· تقييم ممتاز</span>
                    </div>

                    <div className="flex items-baseline gap-2 pt-2 border-t border-slate-100">
                      <span className="text-2xl font-black text-emerald-700">
                        {product.price} <span className="text-xs font-semibold">درهم</span>
                      </span>
                      {originalPrice > product.price && (
                        <span className="text-xs text-slate-400 line-through">
                          {originalPrice} درهم
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:bg-emerald-50 transition-colors">
                  <span>طلب الآن عبر الدفع عند الاستلام</span>
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

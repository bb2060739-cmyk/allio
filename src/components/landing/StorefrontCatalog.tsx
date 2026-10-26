import React, { useState } from 'react';
import { Product } from '../../types';
import { fetchMoreProducts } from '../../lib/storage';
import { Truck, ShieldCheck, RefreshCw, ArrowLeft, Star, Sparkles, Loader2, PlusCircle } from 'lucide-react';

interface StorefrontCatalogProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const StorefrontCatalog: React.FC<StorefrontCatalogProps> = ({
  products,
  onSelectProduct
}) => {
  const [displayCount, setDisplayCount] = useState<number>(12);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMoreInFirestore, setHasMoreInFirestore] = useState<boolean>(true);

  // Paginated visible products (strictly limited to 12 initially)
  const visibleProducts = products.slice(0, displayCount);
  const hasMore = visibleProducts.length < products.length || hasMoreInFirestore;

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const result = await fetchMoreProducts(displayCount, 12);
      setDisplayCount(prev => prev + 12);
      setHasMoreInFirestore(result.hasMore);
    } catch (err) {
      console.warn('Load more error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>عروض التجارة الإلكترونية والدفع عند الاستلام بالمغرب - توصيل مجاني وسريع 🇲🇦</span>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-600 font-sans tracking-tight">
              Allio
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-bold">الدفع نقداً بعد المعاينة</span>
            </div>
          </div>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-slate-900">العروض المتوفرة اليوم</h2>
            <p className="text-xs text-slate-500 mt-0.5">انقر على أي منتج لفتح صفحة الهبوط واستمارة الطلب المباشرة</p>
          </div>
          <span className="text-[11px] bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
            عرض {visibleProducts.length} من {Math.max(visibleProducts.length, products.length)} منتج (12 لكل صفحة)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleProducts.map((product) => {
            const originalPrice = product.originalPrice || Math.round(product.price * 1.6);
            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="relative bg-slate-50 border-b border-slate-100 overflow-hidden p-4 flex items-center justify-center min-h-[220px] sm:min-h-[250px]">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto max-h-[230px] object-contain group-hover:scale-105 transition-transform duration-300"
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

        {/* Load More Button for Pagination & Free Tier Limit Protection */}
        {hasMore && (
          <div className="pt-8 pb-4 flex flex-col items-center justify-center gap-2">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-emerald-500 rounded-2xl text-xs md:text-sm font-black shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>جاري تحميل 12 منتج إضافي...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>تحميل المزيد من المنتجات (+12 منتج)</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-400 font-medium">
              حماية الحصة المجانية: يتم تحميل المنتجات على دفعات (12 في كل دفعة) لتفادي استهلاك القراءات
            </span>
          </div>
        )}
      </main>
    </div>
  );
};

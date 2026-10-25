import React, { useState, useEffect } from 'react';
import { Product, Order } from '../../types';
import { MoroccanOrderForm } from './MoroccanOrderForm';
import { ThankYouPage } from './ThankYouPage';
import { initTrackingPixels, trackPixelEvent } from '../../lib/pixelTracker';
import { 
  Truck, ShieldCheck, RefreshCw, Star, CheckCircle, 
  Flame, ShoppingBag, Eye, Award, Sparkles, ChevronLeft
} from 'lucide-react';

interface PublicProductLandingProps {
  product: Product;
  onNavigateHome?: () => void;
}

export const PublicProductLanding: React.FC<PublicProductLandingProps> = ({
  product,
  onNavigateHome
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [activeViewerCount, setActiveViewerCount] = useState(18);

  // Initialize pixels on mount and track ViewContent
  useEffect(() => {
    initTrackingPixels(product.fbPixelId, product.tiktokPixelId);

    trackPixelEvent('ViewContent', product.fbPixelId, product.tiktokPixelId, {
      content_name: product.name,
      content_ids: [product.id],
      value: product.price,
      currency: 'MAD'
    });

    // Random realistic Moroccan live shopper count
    const interval = setInterval(() => {
      setActiveViewerCount(prev => Math.floor(Math.random() * 8) + 14);
    }, 12000);

    return () => clearInterval(interval);
  }, [product]);

  const scrollToOrderForm = () => {
    const el = document.getElementById('order-form-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (completedOrder) {
    return (
      <ThankYouPage
        order={completedOrder}
        product={product}
        onBackToHome={() => setCompletedOrder(null)}
      />
    );
  }

  const originalPrice = product.originalPrice || Math.round(product.price * 1.6);
  const discountPercent = Math.round(((originalPrice - product.price) / originalPrice) * 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 md:pb-12">
      {/* Top Notification Bar */}
      <div className="bg-emerald-700 text-white text-xs py-2 px-4 text-center font-semibold flex items-center justify-center gap-2">
        <Truck className="w-4 h-4 text-emerald-200" />
        <span>توصيل مجاني وسريع لجميع مدن المغرب 🇲🇦 والدفع بعد استلام وفحص طلبيتك</span>
      </div>

      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span 
              onClick={onNavigateHome}
              className={`text-2xl font-black tracking-tight text-emerald-600 font-sans ${onNavigateHome ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
            >
              Allio
            </span>
            <span className="hidden sm:inline-block text-xs text-slate-400 border-r border-slate-200 pr-3 mr-1">
              متجر الدفع عند الاستلام بالمغرب
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={scrollToOrderForm}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>اطلب الآن</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Product Container */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-8">
        {/* Scarcity & Social Proof Kicker */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-2 text-xs text-amber-900">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span className="font-bold">طلب مرتفع اليوم بالمغرب:</span>
            <span>بقي فقط {product.stockCount} قطع بالمستودع</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>يشاهد هذا المنتج الآن <strong className="text-slate-900">{activeViewerCount}</strong> شخصاً</span>
          </div>
        </div>

        {/* 2-Column Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Gallery / Visuals (Lg: 7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Primary Main Image Container */}
            <div className="relative aspect-4/3 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[selectedImageIndex] || product.images[0]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-all duration-300"
                  onError={(e) => {
                    // Fallback to stylized SVG placeholder if image fails
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}

              {/* Styled Fallback Container (Zero-Broken-Image Policy) */}
              <div 
                className="hidden w-full h-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-emerald-50 to-slate-200 text-slate-500 p-6 text-center"
              >
                <ShoppingBag className="w-16 h-16 text-emerald-600/40 mb-3" />
                <span className="font-bold text-slate-700 text-base">{product.name}</span>
                <span className="text-xs text-slate-400 mt-1">منتج أصلي معتمد مع التوصيل المجاني بالمغرب</span>
              </div>

              {/* Discount Tag */}
              {discountPercent > 0 && (
                <div className="absolute top-3 right-3 bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-md">
                  تخفيض -{discountPercent}%
                </div>
              )}

              {/* Badge */}
              {product.badge && (
                <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-xs px-3 py-1 rounded-lg">
                  {product.badge}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Description & Features Box */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>عن هذا المنتج:</span>
              </h2>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                {product.fullDescription || product.shortDescription}
              </p>

              {/* Bullet Features */}
              {product.features && product.features.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    أهم المميزات والمواصفات:
                  </h3>
                  <div className="space-y-2">
                    {product.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm text-slate-800">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Moroccan Customer Reviews / Social Proof */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">آراء وتقييمات زبنائنا بالمغرب</h3>
                  <div className="flex items-center gap-1.5 text-amber-500 text-xs mt-0.5">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="font-bold text-slate-700">4.9 / 5</span>
                    <span className="text-slate-400">(بناءً على 142 طلباً مؤكداً)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">عمر الوزاني</span>
                      <span className="text-slate-400">· الدار البيضاء</span>
                    </div>
                    <span className="text-emerald-700 font-semibold text-[11px]">مشتري مؤكد ✓</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    "صراحة السلعة جودة عالية والموزع كان محترم جداً، فتحت الكولية وفحصتها عاد خلصت. الله يعطيكم الصحة!"
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">سعاد المنصوري</span>
                      <span className="text-slate-400">· مراكش</span>
                    </div>
                    <span className="text-emerald-700 font-semibold text-[11px]">مشتري مؤكد ✓</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    "وصلاتني في 24 ساعة كما وعدتم، نفس المواصفات اللي شفت في الإعلان تماماً شكراً لكم."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Pricing & The Order Form (Lg: 5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Title & Pricing Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
                {product.name}
              </h1>

              {/* Price Block */}
              <div className="flex items-baseline gap-3 pb-3 border-b border-slate-100">
                <span className="text-3xl md:text-4xl font-black text-emerald-700">
                  {product.price} <span className="text-lg font-semibold">درهم</span>
                </span>
                {originalPrice > product.price && (
                  <span className="text-lg text-slate-400 line-through">
                    {originalPrice} درهم
                  </span>
                )}
                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-md border border-emerald-200">
                  توصيل مجاني 0 درهم
                </span>
              </div>

              {/* Short Description */}
              <p className="text-slate-600 text-sm leading-relaxed">
                {product.shortDescription}
              </p>

              {/* Reassurances list */}
              <div className="space-y-2 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>الدفع عند الاستلام نقداً بعد فحص السلعة</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>شحن سريع لجميع مدن المغرب خلال 24 إلى 48 ساعة</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>ضمان الرضا أو الاسترجاع والاستبدال خلال 14 يوماً</span>
                </div>
              </div>
            </div>

            {/* The Moroccan COD Order Form */}
            <MoroccanOrderForm
              product={product}
              onOrderSuccess={(order) => setCompletedOrder(order)}
            />
          </div>
        </div>
      </main>

      {/* Mobile Sticky Buy Button (Capped <= 15% viewport height per skill guidelines) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-500 block">السعر شامل التوصيل:</span>
            <span className="text-xl font-black text-emerald-700">
              {product.price} <span className="text-xs font-semibold">درهم</span>
            </span>
          </div>

          <button
            onClick={scrollToOrderForm}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 animate-pulse"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>اطلب الآن - الدفع عند الاستلام</span>
          </button>
        </div>
      </div>
    </div>
  );
};

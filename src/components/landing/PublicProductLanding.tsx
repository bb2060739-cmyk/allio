import React, { useState, useEffect } from 'react';
import { Product, Order } from '../../types';
import { MoroccanOrderForm } from './MoroccanOrderForm';
import { ThankYouPage } from './ThankYouPage';
import { initTrackingPixels, trackPixelEvent } from '../../lib/pixelTracker';
import { getStoreById, getDefaultDesignConfig } from '../../lib/storage';
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

  // Dynamic Store & Design Architecture
  const store = getStoreById(product.storeId);
  const design = product.designConfig || getDefaultDesignConfig(product.name, product.fullDescription);
  const primaryColor = store.design?.primaryColor || '#059669';
  const secondaryColor = store.design?.secondaryColor || '#0f172a';
  const logoText = store.design?.logoText || 'Allio';
  const logoImageUrl = store.design?.logoImageUrl;
  const announcement = store.design?.announcementText || 'توصيل مجاني وسريع لجميع مدن المغرب 🇲🇦 والدفع بعد استلام وفحص طلبيتك';

  // Initialize pixels on mount and track ViewContent
  useEffect(() => {
    initTrackingPixels(product.fbPixelId, product.tiktokPixelId);

    trackPixelEvent('ViewContent', product.fbPixelId, product.tiktokPixelId, {
      content_name: product.name,
      content_ids: [product.id],
      value: product.price,
      currency: 'MAD'
    });

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

  // Determine active display image
  const displayImage = (design.hero.enabled && design.hero.heroImageUrl) 
    ? design.hero.heroImageUrl 
    : (product.images && product.images.length > 0 ? (product.images[selectedImageIndex] || product.images[0]) : null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 md:pb-12">
      {/* Top Announcement Bar (Dynamic Store-level Secondary Color & Text) */}
      <div 
        className="text-white text-xs py-2 px-4 text-center font-semibold flex items-center justify-center gap-2 transition-colors"
        style={{ backgroundColor: secondaryColor }}
      >
        <Truck className="w-4 h-4 text-white/80" />
        <span>{announcement}</span>
      </div>

      {/* Navigation Header (Dynamic Store-level Logo & Primary Color) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {store.design?.logoType === 'image' && logoImageUrl ? (
              <img 
                src={logoImageUrl} 
                alt={logoText} 
                onClick={onNavigateHome}
                className="h-8 w-auto object-contain cursor-pointer hover:opacity-90" 
              />
            ) : (
              <span 
                onClick={onNavigateHome}
                className={`text-2xl font-black tracking-tight font-sans transition-colors ${onNavigateHome ? 'cursor-pointer hover:opacity-90' : ''}`}
                style={{ color: primaryColor }}
              >
                {logoText}
              </span>
            )}
            <span className="hidden sm:inline-block text-xs text-slate-400 border-r border-slate-200 pr-3 mr-1">
              {store.name} · {store.niche}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={scrollToOrderForm}
              className="px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>اطلب الآن</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Product Container */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-8">
        
        {/* Dynamic HERO SECTION (Controlled via Design Editor) */}
        {design.hero.enabled && (
          <div 
            className="rounded-3xl p-6 md:p-8 text-white shadow-lg space-y-3 relative overflow-hidden transition-all"
            style={{ backgroundColor: secondaryColor }}
          >
            <div className="relative z-10 space-y-2 max-w-2xl">
              {design.hero.badgeText && (
                <span 
                  className="inline-block text-xs font-black px-3 py-1 rounded-full shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  {design.hero.badgeText}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-black leading-tight text-white">
                {design.hero.headline || product.name}
              </h1>
              {design.hero.subheadline && (
                <p className="text-sm text-slate-300 leading-relaxed">
                  {design.hero.subheadline}
                </p>
              )}
              {design.hero.ctaText && (
                <div className="pt-2">
                  <button
                    onClick={scrollToOrderForm}
                    className="px-6 py-2.5 rounded-xl font-black text-xs text-white shadow-md transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span>{design.hero.ctaText}</span>
                  </button>
                </div>
              )}
            </div>
            {/* Subtle background glow */}
            <div 
              className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
        )}

        {/* Scarcity & Social Proof Kicker */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-2 text-xs text-amber-900">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span className="font-bold">طلب مرتفع اليوم بالمغرب:</span>
            <span>بقي فقط {product.stockCount} قطع بالمستودع</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>يشاهد هذا العرض الآن <strong className="text-slate-900">{activeViewerCount}</strong> زبوناً</span>
          </div>
        </div>

        {/* 2-Column Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Gallery / Visuals (Lg: 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Primary Main Image Container - Responsive, full aspect ratio, never cropped */}
            <div className="relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs flex items-center justify-center p-3 sm:p-5 min-h-[320px] sm:min-h-[420px]">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[550px] object-contain rounded-xl transition-all duration-300 mx-auto"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}

              {/* Styled Fallback Container */}
              <div 
                className="hidden w-full h-full min-h-[300px] flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-emerald-50 to-slate-200 text-slate-500 p-6 text-center"
              >
                <ShoppingBag className="w-16 h-16 text-emerald-600/40 mb-3" />
                <span className="font-bold text-slate-700 text-base">{product.name}</span>
                <span className="text-xs text-slate-400 mt-1">منتج أصلي معتمد مع التوصيل المجاني بالمغرب</span>
              </div>

              {/* Discount Tag */}
              {discountPercent > 0 && (
                <div className="absolute top-3 right-3 bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-md z-10">
                  تخفيض -{discountPercent}%
                </div>
              )}

              {/* Badge */}
              {product.badge && (
                <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-xs px-3 py-1 rounded-lg z-10">
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
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all bg-white p-1 flex items-center justify-center cursor-pointer ${
                      selectedImageIndex === idx
                        ? 'ring-2 shadow-sm'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: selectedImageIndex === idx ? primaryColor : undefined,
                      boxShadow: selectedImageIndex === idx ? `0 0 0 2px ${primaryColor}30` : undefined
                    }}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Dynamic Description Box */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
                <span>عن هذا المنتج:</span>
              </h2>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                {product.fullDescription || product.shortDescription}
              </p>
            </div>

            {/* Dynamic FEATURES SECTION (Controlled via Design Editor) */}
            {design.features.enabled && design.features.items.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" style={{ color: primaryColor }} />
                  <span>{design.features.title || 'أهم المميزات والمواصفات:'}</span>
                </h3>

                <div className="space-y-2.5 pt-1">
                  {design.features.items.map((feat) => (
                    <div key={feat.id} className="flex items-start gap-2.5 text-sm text-slate-800">
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">{feat.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic TESTIMONIALS SECTION (Controlled via Design Editor) */}
            {design.testimonials.enabled && design.testimonials.items.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {design.testimonials.title || 'آراء وتقييمات زبنائنا بالمغرب'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-amber-500 text-xs mt-0.5">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="font-bold text-slate-700">4.9 / 5</span>
                      <span className="text-slate-400">(تقييمات موثقة من زبائن حقيقيين)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {design.testimonials.items.map((item) => (
                    <div key={item.id} className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{item.name}</span>
                          <span className="text-slate-400">· {item.city}</span>
                        </div>
                        <span className="font-semibold text-[11px]" style={{ color: primaryColor }}>
                          مشتري مؤكد ✓
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        &quot;{item.comment}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic GUARANTEE SECTION (Controlled via Design Editor) */}
            {design.guarantee.enabled && (
              <div 
                className="rounded-2xl p-5 border space-y-2"
                style={{ 
                  backgroundColor: `${primaryColor}08`, 
                  borderColor: `${primaryColor}30` 
                }}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <ShieldCheck className="w-5 h-5" style={{ color: primaryColor }} />
                  <span>{design.guarantee.title || 'ضمان الرضا والجودة في متجرنا'}</span>
                  {design.guarantee.badgeText && (
                    <span 
                      className="text-[10px] text-white px-2 py-0.5 rounded-full mr-auto font-bold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {design.guarantee.badgeText}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {design.guarantee.description || 'نوفر لكم إمكانية المعاينة قبل الدفع، مع ضمان استبدال أو استرجاع مجاني في حالة أي عيب مصنعي.'}
                </p>
              </div>
            )}
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
                <span className="text-3xl md:text-4xl font-black" style={{ color: primaryColor }}>
                  {product.price} <span className="text-lg font-semibold">{product.currency || 'درهم'}</span>
                </span>
                {originalPrice > product.price && (
                  <span className="text-lg text-slate-400 line-through">
                    {originalPrice} درهم
                  </span>
                )}
                <span 
                  className="text-xs font-bold px-2.5 py-1 rounded-md border"
                  style={{ 
                    backgroundColor: `${primaryColor}12`, 
                    color: primaryColor,
                    borderColor: `${primaryColor}30`
                  }}
                >
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
                  <CheckCircle className="w-4 h-4" style={{ color: primaryColor }} />
                  <span>الدفع عند الاستلام نقداً بعد فحص السلعة</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" style={{ color: primaryColor }} />
                  <span>شحن سريع لجميع مدن المغرب خلال 24 إلى 48 ساعة</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" style={{ color: primaryColor }} />
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

      {/* Mobile Sticky Buy Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-500 block">السعر شامل التوصيل:</span>
            <span className="text-xl font-black" style={{ color: primaryColor }}>
              {product.price} <span className="text-xs font-semibold">درهم</span>
            </span>
          </div>

          <button
            onClick={scrollToOrderForm}
            className="flex-1 py-3 px-4 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 animate-pulse cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>اطلب الآن - الدفع عند الاستلام</span>
          </button>
        </div>
      </div>
    </div>
  );
};

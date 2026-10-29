import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Product, Order, Store } from '../../types';
import { MoroccanOrderForm } from './MoroccanOrderForm';
import { ThankYouPage } from './ThankYouPage';
import { initTrackingPixels, trackPixelEvent } from '../../lib/pixelTracker';
import { getStoreById, getDefaultDesignConfig } from '../../lib/storage';
import { getLocalizedText } from '../../utils/i18n';
import { useDynamicHead } from '../../utils/dynamicHead';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { 
  Truck, ShieldCheck, RefreshCw, Star, CheckCircle, 
  Flame, ShoppingBag, Eye, Award, Sparkles, ChevronLeft
} from 'lucide-react';

interface PublicProductLandingProps {
  product: Product;
  store?: Store;
  onNavigateHome?: () => void;
}

export const PublicProductLanding: React.FC<PublicProductLandingProps> = ({
  product,
  store: propStore,
  onNavigateHome
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'ar';
  const isRTL = currentLang === 'ar';

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [activeViewerCount, setActiveViewerCount] = useState(18);

  const productName = getLocalizedText(product.name, currentLang);
  const productShortDesc = getLocalizedText(product.shortDescription, currentLang);
  const productFullDesc = getLocalizedText(product.fullDescription, currentLang);
  const productBadge = getLocalizedText(product.badge, currentLang);

  // Dynamic Store & Design Architecture: Read from parent Store
  const store = propStore || getStoreById(product.storeId);
  const design = product.designConfig || getDefaultDesignConfig(productName, productFullDesc);
  const primaryColor = store.design?.primaryColor || '#059669';
  const secondaryColor = store.design?.secondaryColor || '#0f172a';
  const logoText = store.design?.logoText || 'Allio';
  const logoImageUrl = store.design?.logoImageUrl;
  const announcement = getLocalizedText(store.design?.announcementText, currentLang) || t('landing.announcement');

  // Dynamic Browser Tab (Title & Favicon) synchronization using already loaded product & store JSON
  useDynamicHead({
    title: `${productName} | ${store.name || 'Allio'}`,
    storeName: store.name || 'Allio',
    logoImageUrl: store.design?.faviconUrl || store.design?.logoImageUrl || product.images?.[0],
    faviconUrl: store.design?.faviconUrl,
    primaryColor
  });

  // Initialize pixels on mount and track ViewContent
  useEffect(() => {
    initTrackingPixels(product.fbPixelId, product.tiktokPixelId);

    trackPixelEvent('ViewContent', product.fbPixelId, product.tiktokPixelId, {
      content_name: productName,
      content_ids: [product.id],
      value: product.price,
      currency: 'MAD'
    });

    const interval = setInterval(() => {
      setActiveViewerCount(prev => Math.floor(Math.random() * 8) + 14);
    }, 12000);

    return () => clearInterval(interval);
  }, [product, productName]);

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

  const heroHeadline = getLocalizedText(design.hero.headline, currentLang) || productName;
  const heroSubheadline = getLocalizedText(design.hero.subheadline, currentLang);
  const heroBadge = getLocalizedText(design.hero.badgeText, currentLang);
  const heroCtaText = getLocalizedText(design.hero.ctaText, currentLang);
  const headerCtaText = getLocalizedText(design.headerCtaText, currentLang);
  const stickyCtaText = getLocalizedText(design.stickyMobileCtaText, currentLang) || t('landing.sticky_order_btn');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 md:pb-12">
      {/* Top Announcement Bar (Dynamic Store-level Secondary Color & Text) */}
      {announcement?.trim() && (
        <div 
          className="text-white text-xs py-2 px-4 text-center font-semibold flex items-center justify-center gap-2 transition-colors"
          style={{ backgroundColor: secondaryColor }}
        >
          <Truck className="w-4 h-4 text-white/80 shrink-0" />
          <span>{announcement}</span>
        </div>
      )}

      {/* Navigation Header with Language Switcher */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
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
            <span className="hidden sm:inline-block text-xs text-slate-400 border-s border-slate-200 ps-3 ms-1">
              {store.name} · {store.niche}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Dynamic Header CTA (Smart Hiding if blank) */}
            {headerCtaText?.trim() && (
              <button
                onClick={scrollToOrderForm}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer hover:opacity-90"
                style={{ backgroundColor: design.headerCtaColor || primaryColor }}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{headerCtaText}</span>
              </button>
            )}

            {/* Language Switcher */}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Product Container */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-8">
        {/* Dynamic HERO SECTION (Smart Hiding if disabled or all text empty) */}
            {design.hero.enabled && Boolean(
              heroHeadline?.trim() ||
              heroSubheadline?.trim() ||
              heroBadge?.trim() ||
              heroCtaText?.trim()
            ) && (
          <div 
            className="rounded-3xl p-6 md:p-8 text-white shadow-lg space-y-3 relative overflow-hidden transition-all text-start"
            style={{ backgroundColor: secondaryColor }}
          >
            <div className="relative z-10 space-y-2 max-w-2xl">
              {heroBadge?.trim() && (
                <span 
                  className="inline-block text-xs font-black px-3 py-1 rounded-full shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  {heroBadge}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-black leading-tight text-white">
                {heroHeadline}
              </h1>
              {heroSubheadline?.trim() && (
                <p className="text-sm text-slate-300 leading-relaxed">
                  {heroSubheadline}
                </p>
              )}
              {heroCtaText?.trim() && (
                <div className="pt-2">
                  <button
                    onClick={scrollToOrderForm}
                    className="px-6 py-2.5 rounded-xl font-black text-xs text-white shadow-md transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer hover:opacity-95"
                    style={{ 
                      backgroundColor: design.hero.ctaColor || primaryColor,
                      color: design.hero.ctaTextColor || '#ffffff'
                    }}
                  >
                    <span>{heroCtaText}</span>
                  </button>
                </div>
              )}
            </div>
            {/* Subtle background glow */}
            <div 
              className="absolute -bottom-10 -start-10 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
        )}

        {/* Dynamic Scarcity & Social Proof Kicker (Smart Hiding) */}
        {(() => {
          const scarcity = design.scarcity;
          const isEnabled = scarcity ? scarcity.enabled !== false : true;
          const rawStock = scarcity?.stockText !== undefined 
            ? getLocalizedText(scarcity.stockText, currentLang) 
            : t('landing.stock_left', { stock: product.stockCount });
          const rawViewers = scarcity?.viewersText !== undefined 
            ? getLocalizedText(scarcity.viewersText, currentLang) 
            : t('landing.viewers_now', { count: activeViewerCount });

          const stockTxt = rawStock ? rawStock.replace('{stock}', String(product.stockCount)) : '';
          const viewersTxt = rawViewers ? rawViewers.replace('{count}', String(activeViewerCount)) : '';

          if (!isEnabled || (!stockTxt && !viewersTxt)) return null;

          return (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-2 text-xs text-amber-900">
              {stockTxt && (
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                  <span className="font-bold">{stockTxt}</span>
                </div>
              )}
              {viewersTxt && (
                <div className="flex items-center gap-1 text-slate-600">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>{viewersTxt}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* 2-Column Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Gallery / Visuals (Lg: 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {displayImage && (
              <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm p-4 flex items-center justify-center relative min-h-[300px] sm:min-h-[400px]">
                <img
                  src={displayImage}
                  alt={productName}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[420px] object-contain transition-all duration-300"
                />
                {productBadge?.trim() && (
                  <span className="absolute top-4 end-4 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md">
                    {productBadge}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="absolute top-4 start-4 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-md">
                    {t('landing.discount_badge', { percent: discountPercent })}
                  </span>
                )}
              </div>
            )}

            {/* Thumbnail switcher if multiple images exist */}
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-2xl border-2 p-1 bg-white shrink-0 overflow-hidden transition-all cursor-pointer ${
                      selectedImageIndex === idx ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${productName} - ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Dynamic FEATURES LIST (Smart Hiding) */}
            {design.features.enabled && design.features.items.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 text-start">
                {Boolean(getLocalizedText(design.features.title, currentLang)?.trim()) && (
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    <span>{getLocalizedText(design.features.title, currentLang)}</span>
                  </h3>
                )}
                <ul className="space-y-2.5">
                  {design.features.items.map((feat) => {
                    const featTitle = getLocalizedText(feat.title, currentLang);
                    const featDesc = getLocalizedText(feat.description, currentLang);
                    if (!featTitle?.trim()) return null;
                    return (
                      <li key={feat.id} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">{featTitle}</strong>
                          {featDesc && <p className="text-slate-500 text-xs mt-0.5">{featDesc}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Dynamic TESTIMONIALS SECTION (Smart Hiding) */}
            {design.testimonials.enabled && design.testimonials.items.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 text-start">
                <div className="flex items-center justify-between">
                  {Boolean(getLocalizedText(design.testimonials.title, currentLang)?.trim()) && (
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                      <span>{getLocalizedText(design.testimonials.title, currentLang)}</span>
                    </h3>
                  )}
                  {Boolean(getLocalizedText(design.testimonials.ratingNoteText, currentLang)?.trim()) && (
                    <span className="text-xs text-slate-400">
                      {getLocalizedText(design.testimonials.ratingNoteText, currentLang)}
                    </span>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  {design.testimonials.items.map((item) => {
                    const authorName = getLocalizedText(item.name, currentLang);
                    const authorCity = getLocalizedText(item.city, currentLang);
                    const comment = getLocalizedText(item.comment, currentLang);
                    const verifiedText = getLocalizedText(design.testimonials.verifiedBadgeText, currentLang) || t('landing.verified_buyer');
                    return (
                      <div key={item.id} className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{authorName}</span>
                            {authorCity && <span className="text-slate-400">· {authorCity}</span>}
                          </div>
                          {verifiedText?.trim() && (
                            <span className="font-semibold text-[11px]" style={{ color: primaryColor }}>
                              {verifiedText}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          &quot;{comment}&quot;
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dynamic GUARANTEE SECTION (Smart Hiding) */}
            {design.guarantee.enabled && (() => {
              const gTitle = getLocalizedText(design.guarantee.title, currentLang);
              const gDesc = getLocalizedText(design.guarantee.description, currentLang);
              const gBadge = getLocalizedText(design.guarantee.badgeText, currentLang);

              if (!gTitle?.trim() && !gDesc?.trim()) return null;

              return (
                <div 
                  className="rounded-2xl p-5 border space-y-2 transition-all text-start"
                  style={{ 
                    backgroundColor: design.guarantee.bgColor || `${primaryColor}08`, 
                    borderColor: `${primaryColor}30`,
                    color: design.guarantee.textColor || undefined
                  }}
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: primaryColor }} />
                    {gTitle?.trim() && <span>{gTitle}</span>}
                    {gBadge?.trim() && (
                      <span 
                        className="text-[10px] text-white px-2 py-0.5 rounded-full ms-auto font-bold shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {gBadge}
                      </span>
                    )}
                  </div>
                  {gDesc?.trim() && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {gDesc}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Right Column: Title, Pricing & The Order Form (Lg: 5 cols) */}
          <div className="lg:col-span-5 space-y-5 text-start">
            {/* Title & Pricing Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
                {productName}
              </h1>

              {/* Price Block */}
              <div className="flex items-baseline gap-3 pb-3 border-b border-slate-100">
                <span className="text-3xl md:text-4xl font-black" style={{ color: primaryColor }}>
                  {product.price} <span className="text-lg font-semibold">{t('common.currency')}</span>
                </span>
                {originalPrice > product.price && (
                  <span className="text-lg text-slate-400 line-through">
                    {originalPrice} {t('common.currency')}
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
                  {t('storefront.free_shipping_badge')}
                </span>
              </div>

              {/* Short Description */}
              {productShortDesc?.trim() && (
                <p className="text-slate-600 text-sm leading-relaxed">
                  {productShortDesc}
                </p>
              )}

              {/* Reassurances list (Dynamic CMS & Smart Hiding) */}
              {(() => {
                const config = design.reassurances;
                const isEnabled = config ? config.enabled !== false : true;
                const items = config?.items?.map(it => getLocalizedText(it, currentLang)).filter(item => Boolean(item?.trim())) || [
                  t('landing.reassurance_1'),
                  t('landing.reassurance_2'),
                  t('landing.reassurance_3')
                ];

                if (!isEnabled || items.length === 0) return null;

                return (
                  <div className="space-y-2 text-xs text-slate-600 pt-1">
                    {items.map((reassurance, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                        <span>{reassurance}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* The Moroccan COD Order Form */}
            <MoroccanOrderForm
              product={product}
              onOrderSuccess={(order) => setCompletedOrder(order)}
            />
          </div>
        </div>
      </main>

      {/* Dynamic Footer (Smart Hiding) */}
      {(() => {
        const footerText = getLocalizedText(design.footer?.text, currentLang);
        const footerCopyright = getLocalizedText(design.footer?.copyrightText, currentLang);
        if (design.footer?.enabled === false || (!footerText?.trim() && !footerCopyright?.trim())) {
          return null;
        }

        return (
          <footer className="max-w-5xl mx-auto px-4 mt-12 pt-8 pb-4 border-t border-slate-200 text-center text-xs text-slate-500 space-y-2">
            {footerText?.trim() && <p>{footerText}</p>}
            {footerCopyright?.trim() && (
              <p className="text-slate-400">© {new Date().getFullYear()} {store.name} — {footerCopyright}</p>
            )}
          </footer>
        );
      })()}

      {/* Mobile Sticky Buy Button (Dynamic CMS & Smart Hiding) */}
      {stickyCtaText?.trim() && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-2xl">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-500 block">{t('landing.order_now')}:</span>
              <span className="text-xl font-black" style={{ color: primaryColor }}>
                {product.price} <span className="text-xs font-semibold">{t('common.currency')}</span>
              </span>
            </div>

            <button
              onClick={scrollToOrderForm}
              className="flex-1 py-3 px-4 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 animate-pulse cursor-pointer hover:opacity-95"
              style={{ backgroundColor: design.headerCtaColor || primaryColor }}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{stickyCtaText}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

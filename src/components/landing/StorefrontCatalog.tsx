import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Product, Store } from '../../types';
import { fetchMoreProducts, DEFAULT_STORE } from '../../lib/storage';
import { getLocalizedText } from '../../utils/i18n';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { Truck, ShieldCheck, RefreshCw, ArrowLeft, ArrowRight, Star, Sparkles, Loader2, PlusCircle } from 'lucide-react';

interface StorefrontCatalogProps {
  products: Product[];
  store?: Store;
  onSelectProduct: (product: Product) => void;
}

export const StorefrontCatalog: React.FC<StorefrontCatalogProps> = ({
  products,
  store = DEFAULT_STORE,
  onSelectProduct
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'ar';
  const isRTL = currentLang === 'ar';

  const [displayCount, setDisplayCount] = useState<number>(12);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMoreInFirestore, setHasMoreInFirestore] = useState<boolean>(true);

  // Dynamic Store Design extraction with localization support
  const design = store.design || DEFAULT_STORE.design;
  const primaryColor = design.primaryColor || '#059669';
  const secondaryColor = design.secondaryColor || '#0f172a';
  const announcementText = getLocalizedText(design.announcementText, currentLang);

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

  // Pillars dynamic resolution & smart hiding
  const p1 = { 
    title: getLocalizedText(design.pillar1Title, currentLang), 
    desc: getLocalizedText(design.pillar1Desc, currentLang), 
    icon: Truck 
  };
  const p2 = { 
    title: getLocalizedText(design.pillar2Title, currentLang), 
    desc: getLocalizedText(design.pillar2Desc, currentLang), 
    icon: ShieldCheck 
  };
  const p3 = { 
    title: getLocalizedText(design.pillar3Title, currentLang), 
    desc: getLocalizedText(design.pillar3Desc, currentLang), 
    icon: RefreshCw 
  };
  const activePillars = [p1, p2, p3].filter(p => Boolean(p.title?.trim()));

  const heroBadge = getLocalizedText(design.heroBadge, currentLang);
  const heroTitle = getLocalizedText(design.heroTitle, currentLang);
  const heroSubtitle = getLocalizedText(design.heroSubtitle, currentLang);

  const showHero = Boolean(
    heroBadge?.trim() ||
    heroTitle?.trim() ||
    heroSubtitle?.trim() ||
    activePillars.length > 0
  );

  const catalogTitle = getLocalizedText(design.catalogTitle, currentLang) || t('storefront.catalog_title');
  const catalogSubtitle = getLocalizedText(design.catalogSubtitle, currentLang);
  const footerText = getLocalizedText(design.footerText, currentLang);
  const footerCopyright = getLocalizedText(design.footerCopyright, currentLang);

  const NextArrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 flex flex-col justify-between">
      <div>
        {/* Top Banner (Dynamic CMS & Smart Hiding) */}
        {announcementText?.trim() && (
          <div 
            className="text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 transition-colors"
            style={{ backgroundColor: secondaryColor }}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{announcementText}</span>
          </div>
        )}

        {/* Header with Language Switcher */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {design.logoType === 'image' && design.logoImageUrl ? (
                <img 
                  src={design.logoImageUrl} 
                  alt={design.logoText || store.name} 
                  className="h-8 w-auto object-contain" 
                />
              ) : (
                <span 
                  className="text-2xl font-black font-sans tracking-tight"
                  style={{ color: primaryColor }}
                >
                  {design.logoText || store.name || 'Allio'}
                </span>
              )}
              {store.niche && (
                <span className="hidden sm:inline-block text-xs text-slate-400 border-s border-slate-200 ps-3 ms-1">
                  {store.niche}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {/* Trust Badge */}
              <div 
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-medium"
                style={{ 
                  backgroundColor: `${primaryColor}10`, 
                  borderColor: `${primaryColor}30`,
                  color: primaryColor 
                }}
              >
                <Truck className="w-3.5 h-3.5" />
                <span className="font-bold">{t('storefront.cod_badge')}</span>
              </div>

              {/* Language Switcher */}
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* Hero Section (Dynamic CMS & Smart Hiding) */}
        {showHero && (
          <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/60 py-12 px-4">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              {heroBadge?.trim() && (
                <div 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors"
                  style={{ 
                    backgroundColor: `${primaryColor}12`, 
                    color: primaryColor,
                    borderColor: `${primaryColor}30` 
                  }}
                >
                  <span>{heroBadge}</span>
                </div>
              )}

              {heroTitle?.trim() && (
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  {heroTitle}
                </h1>
              )}

              {heroSubtitle?.trim() && (
                <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                  {heroSubtitle}
                </p>
              )}

              {/* Dynamic 3 Pillars with Smart Hiding */}
              {activePillars.length > 0 && (
                <div className={`grid grid-cols-1 md:grid-cols-${activePillars.length} gap-4 pt-4 max-w-3xl mx-auto text-start`}>
                  {activePillars.map((pillar, idx) => {
                    const PillarIcon = pillar.icon;
                    return (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                        >
                          <PillarIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="font-bold text-xs text-slate-900">{pillar.title}</h2>
                          {pillar.desc && <p className="text-[11px] text-slate-500 mt-0.5">{pillar.desc}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Featured Products Grid */}
        <main className="max-w-6xl mx-auto px-4 pt-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {catalogTitle}
              </h2>
              {catalogSubtitle?.trim() && (
                <p className="text-xs text-slate-500 mt-0.5">{catalogSubtitle}</p>
              )}
            </div>
            <span className="text-[11px] bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
              {t('storefront.showing_products', {
                count: visibleProducts.length,
                total: Math.max(visibleProducts.length, products.length)
              })}
            </span>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              {t('storefront.empty_catalog')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleProducts.map((product) => {
                const productName = getLocalizedText(product.name, currentLang);
                const productShortDesc = getLocalizedText(product.shortDescription, currentLang);
                const productBadge = getLocalizedText(product.badge, currentLang);

                const originalPrice = product.originalPrice || Math.round(product.price * 1.6);
                const rawBuyText = design.buyButtonText !== undefined 
                  ? getLocalizedText(design.buyButtonText, currentLang) 
                  : t('storefront.buy_now_btn');
                const buyButtonText = rawBuyText?.trim();

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
                          alt={productName}
                          referrerPolicy="no-referrer"
                          className="w-full h-auto max-h-[230px] object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                        {productBadge?.trim() && (
                          <span className="absolute top-3 end-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                            {productBadge}
                          </span>
                        )}
                      </div>

                      <div className="p-5 space-y-3">
                        <h3 className="font-bold text-base text-slate-900 transition-colors line-clamp-1">
                          {productName}
                        </h3>
                        {productShortDesc?.trim() && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {productShortDesc}
                          </p>
                        )}

                        <div className="flex items-center gap-1 text-amber-500 text-xs">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                          <span className="font-bold text-slate-700 ms-1">4.9</span>
                          <span className="text-slate-400">· {t('storefront.excellent_rating')}</span>
                        </div>

                        <div className="flex items-baseline gap-2 pt-2 border-t border-slate-100">
                          <span className="text-2xl font-black" style={{ color: primaryColor }}>
                            {product.price} <span className="text-xs font-semibold">{t('common.currency')}</span>
                          </span>
                          {originalPrice > product.price && (
                            <span className="text-xs text-slate-400 line-through">
                              {originalPrice} {t('common.currency')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Product Card Buy Button (Dynamic Text & Color, Smart Hiding if cleared) */}
                    {buyButtonText && (
                      <div 
                        className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold transition-all"
                        style={{ 
                          backgroundColor: design.buyButtonColor ? `${design.buyButtonColor}12` : `${primaryColor}10`,
                          color: design.buyButtonColor || primaryColor
                        }}
                      >
                        <span>{buyButtonText}</span>
                        <NextArrow className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button for Pagination & Free Tier Limit Protection */}
          {hasMore && visibleProducts.length > 0 && (
            <div className="pt-8 pb-4 flex flex-col items-center justify-center gap-2">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-emerald-500 rounded-2xl text-xs md:text-sm font-black shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>{t('storefront.loading_more')}</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>{t('storefront.load_more')}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Dynamic Storefront Footer (Smart Hiding if disabled or empty) */}
      {(footerText?.trim() || footerCopyright?.trim()) && (
        <footer className="max-w-6xl mx-auto px-4 mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-500 space-y-2 w-full">
          {footerText?.trim() && <p className="max-w-xl mx-auto">{footerText}</p>}
          {footerCopyright?.trim() && (
            <p className="text-slate-400">© {new Date().getFullYear()} {store.name} — {footerCopyright}</p>
          )}
        </footer>
      )}
    </div>
  );
};

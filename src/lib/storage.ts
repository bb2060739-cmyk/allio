import { Product, Order, OrderStatus, DashboardStats, Store, LandingPageDesignConfig, LocalizedString, LayoutBlock } from '../types';
import { db, handleFirestoreError, OperationType } from './firebase';
import { ensureAdminAuth } from './auth';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot,
  query,
  where,
  limit
} from 'firebase/firestore';
import { getFromCache, setInCache, invalidateCache, DEFAULT_CACHE_TTL } from './cache';
import { getLocalizedText } from '../utils/i18n';

const PRODUCTS_KEY = 'allio_products';
const ORDERS_KEY = 'allio_orders';
const STORES_KEY = 'allio_stores';

export const DEFAULT_STORE: Store = {
  id: 'store-default',
  name: 'متجر Allio الرئيسي',
  slug: 'main',
  description: 'المتجر الرئيسي لصفحات الهبوط المتعددة والتجارة الإلكترونية بالمغرب',
  niche: 'عام وتجارة إلكترونية',
  currency: 'DH',
  isDefault: true,
  design: {
    primaryColor: '#059669', // Emerald-600
    secondaryColor: '#0f172a', // Slate-900
    logoType: 'text',
    logoText: 'Allio',
    logoImageUrl: '',
    announcementText: 'توصيل مجاني لجميع المدن المغربية 🇲🇦 والدفع نقداً عند الاستلام',
    heroBadge: 'منصة الدفع عند الاستلام في المغرب',
    heroTitle: 'منتجات مختارة بعناية، توصيل مجاني إلى باب منزلك',
    heroSubtitle: 'لا داعي للدفع بالبطاقة البنكية مسبقاً. اطلب الآن، تفقد طلبيتك وافحصها مع الموزع، ثم ادفع نقداً بكل راحة وأمان.',
    pillar1Title: 'توصيل مجاني 0 درهم',
    pillar1Desc: 'شحن سريع لجميع مدن وقرى المغرب مجاناً',
    pillar2Title: 'الدفع بعد المعاينة',
    pillar2Desc: 'تفقد طلبيتك وتأكد منها قبل أن تدفع أي درهم للموزع',
    pillar3Title: 'ضمان الرضا 14 يوماً',
    pillar3Desc: 'إمكانية الاستبدال أو الاسترجاع بكل سهولة ومرونة',
    catalogTitle: 'أفضل العروض الحالية في المغرب',
    catalogSubtitle: 'منتجات أصلية مع توصيل مجاني وضمان الدفع بعد المعاينة عند باب منزلك',
    buyButtonText: 'طلب الآن عبر الدفع عند الاستلام',
    buyButtonColor: '#059669',
    buyButtonTextColor: '#ffffff',
    footerText: 'منصة التجارة الإلكترونية الموثوقة بالمغرب. نوفر تجربة تسوق آمنة وسهلة مع الدفع عند الاستلام.',
    footerCopyright: 'جميع الحقوق محفوظة'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const getDefaultDesignConfig = (productName?: LocalizedString, fullDesc?: LocalizedString): LandingPageDesignConfig => ({
  headerCtaText: 'اطلب الآن',
  headerCtaColor: '#059669',
  hero: {
    enabled: true,
    badgeText: 'عرض حصري بالمغرب 🔥 توصيل سريع والدفع عند الاستلام',
    headline: productName || 'منتج أصلي عالي الجودة متوفر الآن',
    subheadline: fullDesc || 'تخفيض استثنائي لمدة محدودة مع ضمان الجودة والتوصيل لكافة المدن المغربية.',
    ctaText: 'اطلب الآن - الدفع عند الاستلام 🚚',
    ctaColor: '#059669',
    ctaTextColor: '#ffffff',
    heroImageUrl: ''
  },
  scarcity: {
    enabled: true,
    stockText: 'طلب مرتفع اليوم بالمغرب: بقي فقط {stock} قطع بالمستودع',
    viewersText: '{count} زائر يتصفحون هذا العرض حالياً'
  },
  features: {
    enabled: true,
    title: 'أهم المميزات والمواصفات',
    items: [
      { id: 'f-1', title: 'جودة أصلية ومضمونة 100%' },
      { id: 'f-2', title: 'توصيل سريع حتى باب منزلك' },
      { id: 'f-3', title: 'الدفع نقداً بعد فحص المنتج والتأكد منه' }
    ]
  },
  testimonials: {
    enabled: true,
    title: 'آراء وتقييمات زبنائنا في المغرب',
    verifiedBadgeText: 'مشتري مؤكد ✓',
    ratingNoteText: '(تقييمات موثقة من زبائن حقيقيين)',
    items: [
      { id: 't-1', name: 'أمين البرنوصي', city: 'الدار البيضاء', rating: 5, comment: 'الصراحة جودة ممتازة والتوصيل كان في 24 ساعة. شكراً ليكم!' },
      { id: 't-2', name: 'سناء بن جلون', city: 'الرباط', rating: 5, comment: 'منتج واعر بزاف مطابق تماماً للوصف. تعامل راقي وموزع مهذب.' },
      { id: 't-3', name: 'يوسف مراكش', city: 'مراكش', rating: 5, comment: 'وصلني في وقت وجيز وفحصتو عاد خلصت. تبارك الله عليكم.' }
    ]
  },
  guarantee: {
    enabled: true,
    title: 'ضمان الرضا والجودة في متجرنا',
    description: 'نوفر لكم إمكانية المعاينة قبل الدفع، مع ضمان استبدال أو استرجاع مجاني في حالة أي عيب مصنعي.',
    badgeText: 'ضمان ذهبي 100%',
    bgColor: '',
    textColor: ''
  },
  reassurances: {
    enabled: true,
    items: [
      'الدفع عند الاستلام نقداً بعد فحص السلعة',
      'شحن سريع لجميع مدن المغرب خلال 24 إلى 48 ساعة',
      'ضمان الرضا أو الاسترجاع والاستبدال خلال 14 يوماً'
    ]
  },
  orderForm: {
    enabled: true,
    title: 'استمارة الطلب السريع والدفع عند الاستلام',
    subtitle: 'أدخل معلوماتك أدناه وسنتصل بك هاتفياً لتأكيد إرسال الطلبية إلى باب منزلك مجاناً',
    submitButtonText: 'اضغط هنا للطلب الآن',
    submitButtonSubtext: 'الدفع عند الاستلام بعد معاينة المنتج 📦 والتوصيل بالمجان',
    submitButtonColor: '#059669',
    submitButtonTextColor: '#ffffff',
    freeShippingText: 'التوصيل مجاني 100% إلى جميع المدن المغربية المسجلة',
    callConfirmationText: 'سنتصل بك لتأكيد الطلب',
    trustBadge1Title: 'توصيل سريع',
    trustBadge1Sub: '24h إلى 48h',
    trustBadge2Title: 'الدفع عند الاستلام',
    trustBadge2Sub: 'تفقد سلعتك أولاً',
    trustBadge3Title: 'ضمان الاستبدال',
    trustBadge3Sub: '14 يوماً مجاناً'
  },
  footer: {
    enabled: true,
    text: 'متجر مغربي موثوق يوفر تجربة تسوق مريحة وسريعة.',
    copyrightText: 'جميع الحقوق محفوظة'
  },
  stickyMobileCtaText: 'اطلب الآن - الدفع عند الاستلام'
});

export const getDefaultLayoutBlocks = (
  productName: string = '', 
  desc: string = '', 
  images: string[] = []
): LayoutBlock[] => [
  {
    id: 'block-hero',
    type: 'hero',
    title: 'قسم الواجهة الترويجية (Hero Section)',
    enabled: true,
    data: {
      badgeText: 'عرض حصري بالمغرب 🔥 توصيل سريع والدفع عند الاستلام',
      headline: productName || 'منتج أصلي عالي الجودة متوفر الآن',
      subheadline: desc || 'تخفيض استثنائي لمدة محدودة مع ضمان الجودة والتوصيل لكافة المدن المغربية.',
      ctaText: 'اطلب الآن - الدفع عند الاستلام 🚚',
      ctaColor: '#059669',
      ctaTextColor: '#ffffff',
      heroImageUrl: images[0] || ''
    }
  },
  {
    id: 'block-scarcity',
    type: 'scarcity',
    title: 'شريط ندرة المخزون والزوار (Scarcity Banner)',
    enabled: true,
    data: {
      stockText: 'طلب مرتفع اليوم بالمغرب: بقي فقط {stock} قطع بالمستودع',
      viewersText: '{count} زائر يتصفحون هذا العرض حالياً'
    }
  },
  {
    id: 'block-gallery',
    type: 'gallery',
    title: 'معرض صور المنتج (Product Gallery)',
    enabled: true,
    data: {
      title: 'صور وتفاصيل المنتج بدقة عالية',
      images: images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'
      ]
    }
  },
  {
    id: 'block-features',
    type: 'features',
    title: 'أهم المميزات والمواصفات (Key Features)',
    enabled: true,
    data: {
      title: 'أهم المميزات والمواصفات',
      items: [
        { id: 'f-1', title: 'جودة أصلية ومضمونة 100%' },
        { id: 'f-2', title: 'توصيل سريع ومجاني حتى باب منزلك' },
        { id: 'f-3', title: 'الدفع نقداً بعد فحص السلعة والتأكد منها' },
        { id: 'f-4', title: 'ضمان الاستبدال أو الاسترجاع 14 يوماً' }
      ]
    }
  },
  {
    id: 'block-testimonials',
    type: 'testimonials',
    title: 'آراء وتقييمات الزبائن (Customer Reviews)',
    enabled: true,
    data: {
      title: 'آراء وتقييمات زبنائنا في المغرب',
      verifiedBadgeText: 'مشتري مؤكد ✓',
      ratingNoteText: '(تقييمات موثقة من زبائن حقيقيين)',
      items: [
        { id: 't-1', name: 'أمين البرنوصي', city: 'الدار البيضاء', rating: 5, comment: 'الصراحة جودة ممتازة والتوصيل كان في 24 ساعة. شكراً ليكم!' },
        { id: 't-2', name: 'سناء بن جلون', city: 'الرباط', rating: 5, comment: 'منتج واعر بزاف مطابق تماماً للوصف. تعامل راقي وموزع مهذب.' },
        { id: 't-3', name: 'يوسف مراكش', city: 'مراكش', rating: 5, comment: 'وصلني في وقت وجيز وفحصتو عاد خلصت. تبارك الله عليكم.' }
      ]
    }
  },
  {
    id: 'block-guarantee',
    type: 'guarantee',
    title: 'الضمان وثقة المتجر (Money-Back Guarantee)',
    enabled: true,
    data: {
      title: 'ضمان الرضا والجودة في متجرنا',
      description: 'نوفر لكم إمكانية المعاينة قبل الدفع، مع ضمان استبدال أو استرجاع مجاني في حالة أي عيب مصنعي.',
      badgeText: 'ضمان ذهبي 100%'
    }
  },
  {
    id: 'block-reassurances',
    type: 'reassurances',
    title: 'نقاط الطمأنينة والثقة (Trust Points)',
    enabled: true,
    data: {
      items: [
        'الدفع عند الاستلام نقداً بعد فحص السلعة',
        'شحن سريع لجميع مدن المغرب خلال 24 إلى 48 ساعة',
        'ضمان الرضا أو الاسترجاع والاستبدال خلال 14 يوماً'
      ]
    }
  },
  {
    id: 'block-order-form',
    type: 'order_form',
    title: 'استمارة الطلب السريع والدفع عند الاستلام (COD Form)',
    enabled: true,
    data: {
      title: 'استمارة الطلب السريع والدفع عند الاستلام',
      subtitle: 'أدخل معلوماتك أدناه وسنتصل بك هاتفياً لتأكيد إرسال الطلبية إلى باب منزلك مجاناً',
      submitButtonText: 'اضغط هنا للطلب الآن',
      submitButtonSubtext: 'الدفع عند الاستلام بعد معاينة المنتج 📦 والتوصيل بالمجان',
      submitButtonColor: '#059669',
      freeShippingText: 'التوصيل مجاني 100% إلى جميع المدن المغربية المسجلة',
      callConfirmationText: 'سنتصل بك لتأكيد الطلب'
    }
  },
  {
    id: 'block-footer',
    type: 'footer',
    title: 'تذييل الصفحة وحقوق النشر (Footer)',
    enabled: true,
    data: {
      text: 'متجر مغربي موثوق يوفر تجربة تسوق مريحة وسريعة مع الدفع عند الاستلام.',
      copyrightText: 'جميع الحقوق محفوظة'
    }
  }
];

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {
      // ignore
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }
};

// ============================================================================
// STORES API - FIRESTORE + OPTIMISTIC LOCAL CACHE (MULTI-STORE / MULTI-NICHE)
// ============================================================================

export const getStores = (): Store[] => {
  try {
    const data = safeLocalStorage.getItem(STORES_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    return [DEFAULT_STORE];
  } catch {
    return [DEFAULT_STORE];
  }
};

export const getStoreById = (id?: string): Store => {
  const stores = getStores();
  if (!id) return stores[0] || DEFAULT_STORE;
  return stores.find(s => s.id === id) || stores[0] || DEFAULT_STORE;
};

export const getStoreBySlug = (slug?: string): Store => {
  const stores = getStores();
  if (!slug) return stores[0] || DEFAULT_STORE;
  return stores.find(s => s.slug === slug || s.id === slug) || stores[0] || DEFAULT_STORE;
};

export const saveStore = async (storeData: Partial<Store> & { name: string }): Promise<Store> => {
  await ensureAdminAuth();
  const stores = getStores();
  const slug = storeData.slug || storeData.name.toLowerCase().trim()
    .replace(/[^\w\u0621-\u064A\s-]/g, '')
    .replace(/\s+/g, '-');

  let targetStore: Store;
  if (storeData.id && storeData.id.trim()) {
    const existingId = storeData.id.trim();
    const index = stores.findIndex(s => s.id === existingId);
    const existing = index !== -1 ? stores[index] : DEFAULT_STORE;
    targetStore = {
      ...existing,
      ...storeData,
      id: existingId,
      slug: slug || existing.slug || 'store-' + Date.now(),
      name: storeData.name,
      design: {
        ...(existing.design || DEFAULT_STORE.design),
        ...(storeData.design || {})
      },
      updatedAt: new Date().toISOString()
    } as Store;

    if (index !== -1) {
      stores[index] = targetStore;
    } else {
      stores.unshift(targetStore);
    }
  } else {
    const newId = 'store-' + Date.now();
    targetStore = {
      id: newId,
      name: storeData.name,
      slug: slug || 'store-' + Date.now(),
      description: storeData.description || '',
      niche: storeData.niche || 'عام',
      currency: storeData.currency || 'DH',
      isDefault: stores.length === 0,
      design: {
        ...DEFAULT_STORE.design,
        ...(storeData.design || {})
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    stores.unshift(targetStore);
  }

  // 1. Optimistic Local Update
  safeLocalStorage.setItem(STORES_KEY, JSON.stringify(stores));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('allio_stores_updated', { detail: targetStore }));
    window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'stores', data: targetStore } }));
  }

  // 2. Permanent Cloud Firestore Sync
  try {
    const storeRef = doc(db, 'stores', targetStore.id);
    await setDoc(storeRef, targetStore);
    console.log(`[Firebase] Successfully saved store doc: stores/${targetStore.id}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `stores/${targetStore.id}`);
  }

  return targetStore;
};

export const deleteStore = async (storeId: string): Promise<boolean> => {
  if (!storeId || storeId === 'store-default') return false;
  const targetDocId = storeId.trim();
  const stores = getStores();
  const filtered = stores.filter(s => s.id !== targetDocId);
  safeLocalStorage.setItem(STORES_KEY, JSON.stringify(filtered));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('allio_stores_updated', { detail: filtered }));
    window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'stores', data: filtered } }));
  }

  let success = false;
  try {
    const storeRef = doc(db, 'stores', targetDocId);
    await deleteDoc(storeRef);
    success = true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `stores/${targetDocId}`);
  }

  return success;
};

// ============================================================================
// PRODUCTS API - FIRESTORE + OPTIMISTIC LOCAL CACHE
// ============================================================================

export const getProducts = (storeId?: string): Product[] => {
  try {
    const data = safeLocalStorage.getItem(PRODUCTS_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        if (storeId) {
          return parsed.filter(p => p.storeId === storeId || (!p.storeId && storeId === 'store-default'));
        }
        return parsed;
      }
    }
    return [];
  } catch {
    return [];
  }
};

export const getProductBySlug = (slug: string): Product | undefined => {
  const products = getProducts();
  return products.find(p => p.slug === slug || p.id === slug);
};

/**
 * Fetch a single product by slug or id directly from Firestore if not in the initial 12.
 * Consumes exactly 1 read, strictly protecting the free tier from mass document reads.
 */
export const fetchProductBySlug = async (slug: string): Promise<Product | undefined> => {
  // 1. Check local cached products
  const cached = getProductBySlug(slug);
  if (cached) return cached;

  // 2. Query Firestore specifically for this single product
  try {
    const q = query(collection(db, 'products'), where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const prod = { ...(docSnap.data() as Product), id: docSnap.id };
      const current = getProducts();
      if (!current.some(p => p.id === prod.id)) {
        current.push(prod);
        safeLocalStorage.setItem(PRODUCTS_KEY, JSON.stringify(current));
        window.dispatchEvent(new CustomEvent('allio_products_updated', { detail: current }));
      }
      return prod;
    }

    // Direct document ID fallback
    const directDoc = await getDoc(doc(db, 'products', slug));
    if (directDoc.exists()) {
      const prod = { ...(directDoc.data() as Product), id: directDoc.id };
      const current = getProducts();
      if (!current.some(p => p.id === prod.id)) {
        current.push(prod);
        safeLocalStorage.setItem(PRODUCTS_KEY, JSON.stringify(current));
        window.dispatchEvent(new CustomEvent('allio_products_updated', { detail: current }));
      }
      return prod;
    }
  } catch (err) {
    console.warn('[Firestore] Error fetching product by slug:', err);
  }
  return undefined;
};

/**
 * Paginated product fetcher: fetches the next batch of 12 products on demand.
 */
export const fetchMoreProducts = async (currentCount: number, batchSize: number = 12): Promise<{ products: Product[]; hasMore: boolean }> => {
  try {
    const q = query(collection(db, 'products'), limit(currentCount + batchSize));
    const snap = await getDocs(q);
    const remoteProducts: Product[] = [];
    snap.forEach((docSnap) => {
      remoteProducts.push({
        ...(docSnap.data() as Product),
        id: docSnap.id
      });
    });
    remoteProducts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    safeLocalStorage.setItem(PRODUCTS_KEY, JSON.stringify(remoteProducts));
    window.dispatchEvent(new CustomEvent('allio_products_updated', { detail: remoteProducts }));
    return {
      products: remoteProducts,
      hasMore: snap.size >= (currentCount + batchSize)
    };
  } catch (err) {
    console.warn('[Firestore] Error fetching more products:', err);
    return { products: getProducts(), hasMore: false };
  }
};

export const saveProduct = async (productData: Partial<Product> & { name: LocalizedString; price: number; blocks?: LayoutBlock[] }): Promise<Product> => {
  await ensureAdminAuth();
  const products = getProducts();
  const nameStr = getLocalizedText(productData.name, 'en') || getLocalizedText(productData.name, 'ar') || 'product';
  const slug = productData.slug || nameStr.toLowerCase().trim()
    .replace(/[^\w\u0621-\u064A\s-]/g, '')
    .replace(/\s+/g, '-');

  const shortDescStr = typeof productData.shortDescription === 'string' ? productData.shortDescription : getLocalizedText(productData.shortDescription);
  const fullDescStr = typeof productData.fullDescription === 'string' ? productData.fullDescription : getLocalizedText(productData.fullDescription);
  const badgeStr = typeof productData.badge === 'string' ? productData.badge : getLocalizedText(productData.badge, 'ar', 'عرض حصري بالمغرب 🔥');

  let targetProduct: Product;

  if (productData.id && productData.id.trim()) {
    // Update existing product / landing page
    const existingId = productData.id.trim();
    const index = products.findIndex(p => p.id === existingId);
    const existing = index !== -1 ? products[index] : ({} as Product);
    const existingBlocks = existing.blocks && existing.blocks.length > 0 ? existing.blocks : getDefaultLayoutBlocks(nameStr, shortDescStr, productData.images || existing.images || []);

    targetProduct = {
      ...existing,
      ...productData,
      id: existingId,
      storeId: productData.storeId !== undefined ? productData.storeId : (existing.storeId || 'store-default'),
      designConfig: productData.designConfig !== undefined ? productData.designConfig : (existing.designConfig || getDefaultDesignConfig(productData.name, productData.fullDescription)),
      blocks: productData.blocks && productData.blocks.length > 0 ? productData.blocks : existingBlocks,
      slug: slug || existing.slug || 'product-' + Date.now(),
      name: nameStr,
      shortDescription: shortDescStr,
      fullDescription: fullDescStr,
      badge: badgeStr,
      price: Number(productData.price),
      updatedAt: new Date().toISOString()
    } as Product;

    if (index !== -1) {
      products[index] = targetProduct;
    } else {
      products.unshift(targetProduct);
    }
  } else {
    // Create new landing page / product with guaranteed unique document ID
    const newId = 'page-' + Date.now();
    const initImages = productData.images && productData.images.length > 0 ? productData.images : [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'
    ];
    const initialBlocks = productData.blocks && productData.blocks.length > 0
      ? productData.blocks
      : getDefaultLayoutBlocks(nameStr, shortDescStr, initImages);

    targetProduct = {
      id: newId,
      storeId: productData.storeId || 'store-default',
      designConfig: productData.designConfig || getDefaultDesignConfig(nameStr, fullDescStr),
      blocks: initialBlocks,
      slug: slug || 'product-' + Date.now(),
      name: nameStr,
      price: Number(productData.price),
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : undefined,
      currency: 'DH',
      shortDescription: shortDescStr || 'منتج عالي الجودة متوفر حصرياً مع خدمة الدفع عند الاستلام والتوصيل بالمجان.',
      fullDescription: fullDescStr || 'مواصفات وتفاصيل المنتج الشاملة لضمان أفضل تجربة استخدام.',
      features: productData.features || [
        'جودة ممتازة معتمدة ومضمونة 100%',
        'توصيل سريع إلى باب المنزل في جميع مدن المغرب',
        'الدفع عند الاستلام بعد فحص المنتج والتأكد منه',
        'ضمان الاستبدال أو الاسترجاع لمدة 14 يوماً'
      ],
      images: initImages,
      badge: badgeStr || 'عرض حصري بالمغرب 🔥',
      freeShipping: productData.freeShipping !== false,
      inStock: true,
      stockCount: productData.stockCount || 15,
      fbPixelId: productData.fbPixelId?.trim() || '',
      tiktokPixelId: productData.tiktokPixelId?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      salesCount: 0
    };
    products.unshift(targetProduct);
  }

  // 1. Optimistic Local Update
  safeLocalStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('allio_products_updated', { detail: targetProduct }));
    window.dispatchEvent(new CustomEvent('allio_landing_pages_updated', { detail: targetProduct }));
    window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'products', data: targetProduct } }));
  }

  // 2. Permanent Cloud Firestore Sync to BOTH 'products' and 'landing_pages' collections
  try {
    const productRef = doc(db, 'products', targetProduct.id);
    await setDoc(productRef, targetProduct);
    console.log(`[Firebase] Successfully saved product doc: products/${targetProduct.id}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${targetProduct.id}`);
  }

  try {
    const landingPageRef = doc(db, 'landing_pages', targetProduct.id);
    await setDoc(landingPageRef, targetProduct);
    console.log(`[Firebase] Successfully synced landing_page doc: landing_pages/${targetProduct.id}`);
  } catch (lpErr) {
    console.warn(`[Firebase landing_pages] Sync note:`, lpErr);
  }

  return targetProduct;
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  if (!id || typeof id !== 'string') {
    console.error('[Firebase Delete] Invalid product ID provided to deleteProduct:', id);
    return false;
  }

  await ensureAdminAuth();
  const targetDocId = id.trim();
  console.log(`[Firebase Delete] Initiating deleteDoc for product with ID: "${targetDocId}"`);

  // 1. Optimistic Local Cache Update
  const products = getProducts();
  const filtered = products.filter(p => p.id !== targetDocId && p.slug !== targetDocId);
  safeLocalStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('allio_products_updated', { detail: filtered }));
    window.dispatchEvent(new CustomEvent('allio_landing_pages_updated', { detail: filtered }));
    window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'products', data: filtered } }));
  }

  // 2. Permanent Cloud Firestore Deletion via deleteDoc
  let success = false;
  try {
    const productRef = doc(db, 'products', targetDocId);
    await deleteDoc(productRef);
    console.log(`[Firebase Delete] Successfully executed deleteDoc on products/${targetDocId}`);
    success = true;
  } catch (error) {
    console.error(`[Firebase Delete] Error executing deleteDoc on products/${targetDocId}:`, error);
    handleFirestoreError(error, OperationType.DELETE, `products/${targetDocId}`);
  }

  try {
    const lpRef = doc(db, 'landing_pages', targetDocId);
    await deleteDoc(lpRef);
  } catch (lpErr) {
    console.warn('[Firebase Delete] landing_pages doc note:', lpErr);
  }

  // 3. Fallback verification: Check if any document has field id == targetDocId or slug == targetDocId
  try {
    const qField = query(collection(db, 'products'), where('id', '==', targetDocId));
    const snapField = await getDocs(qField);
    for (const d of snapField.docs) {
      if (d.id !== targetDocId) {
        console.log(`[Firebase Delete] Also deleting matching id field doc: products/${d.id}`);
        await deleteDoc(doc(db, 'products', d.id));
      }
    }

    const qSlug = query(collection(db, 'products'), where('slug', '==', targetDocId));
    const snapSlug = await getDocs(qSlug);
    for (const d of snapSlug.docs) {
      if (d.id !== targetDocId) {
        console.log(`[Firebase Delete] Also deleting matching slug doc: products/${d.id}`);
        await deleteDoc(doc(db, 'products', d.id));
      }
    }
  } catch (secondaryErr) {
    console.warn('[Firebase Delete] Secondary cleanup check warning:', secondaryErr);
  }

  return success;
};

// ============================================================================
// ORDERS API - FIRESTORE + OPTIMISTIC LOCAL CACHE
// ============================================================================

export const getOrders = (): Order[] => {
  try {
    const data = safeLocalStorage.getItem(ORDERS_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    return [];
  } catch {
    return [];
  }
};

export const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'> & { id?: string; orderNumber?: string; storeId?: string }): Promise<Order> => {
  const orders = getOrders();
  const newId = orderData.id?.trim() || ('ord-' + Date.now());
  const newOrderNumber = orderData.orderNumber?.trim() || ('AL-' + (1050 + orders.length));
  const nowISO = new Date().toISOString();

  const newOrder: Order = {
    id: newId,
    orderNumber: newOrderNumber,
    storeId: orderData.storeId?.trim() || 'store-default',
    productId: orderData.productId,
    productName: orderData.productName,
    customerName: orderData.customerName.trim(),
    phoneNumber: orderData.phoneNumber.trim(),
    city: orderData.city.trim(),
    address: orderData.address.trim(),
    quantity: Number(orderData.quantity) || 1,
    unitPrice: Number(orderData.unitPrice) || 0,
    shippingFee: Number(orderData.shippingFee) || 0,
    totalPrice: Number(orderData.totalPrice) || 0,
    status: orderData.status || 'new',
    notes: orderData.notes ? String(orderData.notes).trim() : '',
    createdAt: nowISO,
    updatedAt: nowISO,
    fbPixelFired: Boolean(orderData.fbPixelFired),
    tiktokPixelFired: Boolean(orderData.tiktokPixelFired)
  };

  // 1. Optimistic Local Update
  orders.unshift(newOrder);
  safeLocalStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  invalidateCache('dashboard_stats');

  // Update product salesCount and stockCount
  const products = getProducts();
  const prodIndex = products.findIndex(p => p.id === orderData.productId);
  if (prodIndex !== -1) {
    products[prodIndex].salesCount = (products[prodIndex].salesCount || 0) + (orderData.quantity || 1);
    if (products[prodIndex].stockCount > 0) {
      products[prodIndex].stockCount = Math.max(0, products[prodIndex].stockCount - (orderData.quantity || 1));
    }
    safeLocalStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    try {
      const prodRef = doc(db, 'products', products[prodIndex].id);
      updateDoc(prodRef, {
        salesCount: products[prodIndex].salesCount,
        stockCount: products[prodIndex].stockCount
      }).catch(() => {});
    } catch {
      // ignore
    }
  }

  // Notify active components immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('allio_orders_updated', { detail: newOrder }));
    window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'orders', data: newOrder } }));
  }

  // 2. Permanent Cloud Firestore Sync via setDoc directly to Firebase
  // Sanitize object so NO undefined values can ever crash Firestore setDoc
  const sanitizedDoc: Record<string, any> = {};
  for (const [key, value] of Object.entries(newOrder)) {
    if (value !== undefined) {
      sanitizedDoc[key] = value;
    }
  }

  try {
    const orderRef = doc(db, 'orders', newOrder.id);
    await setDoc(orderRef, sanitizedDoc);
    console.log(`[Firebase] Successfully created order doc: orders/${newOrder.id}`, sanitizedDoc);
  } catch (error) {
    console.error(`[Firebase] Error creating order doc: orders/${newOrder.id}:`, error);
    handleFirestoreError(error, OperationType.CREATE, `orders/${newOrder.id}`);
    throw error;
  }

  return newOrder;
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
  if (!orderId) return false;
  const targetDocId = orderId.trim();
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === targetDocId || o.orderNumber === targetDocId);
  const updatedAt = new Date().toISOString();

  if (index !== -1) {
    orders[index].status = status;
    orders[index].updatedAt = updatedAt;
    safeLocalStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    invalidateCache('dashboard_stats');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('allio_orders_updated', { detail: orders[index] }));
      window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'orders', data: orders[index] } }));
    }
  }

  // Permanent Cloud Firestore Update
  let success = false;
  try {
    const orderRef = doc(db, 'orders', targetDocId);
    await updateDoc(orderRef, { status, updatedAt });
    console.log(`[Firebase Update Order] Successfully updated status on orders/${targetDocId}`);
    success = true;
  } catch (error) {
    console.warn(`[Firebase Update Order] Direct updateDoc failed on ${targetDocId}, trying query fallback:`, error);
    try {
      const qField = query(collection(db, 'orders'), where('id', '==', targetDocId));
      const snapField = await getDocs(qField);
      for (const d of snapField.docs) {
        await updateDoc(doc(db, 'orders', d.id), { status, updatedAt });
        success = true;
      }
    } catch (secErr) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${targetDocId}`);
      return false;
    }
  }

  return success;
};

export const deleteOrder = async (orderId: string): Promise<boolean> => {
  if (!orderId || typeof orderId !== 'string') {
    console.error('[Firebase Delete Order] Invalid order ID provided:', orderId);
    return false;
  }

  const targetDocId = orderId.trim();
  console.log(`[Firebase Delete Order] Initiating permanent deleteDoc for order ID: "${targetDocId}"`);

  // 1. Optimistic Local Cache Update
  const orders = getOrders();
  const filtered = orders.filter(o => o.id !== targetDocId && o.orderNumber !== targetDocId);
  safeLocalStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));
  invalidateCache('dashboard_stats');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('allio_orders_updated', { detail: filtered }));
    window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'orders', data: filtered } }));
  }

  // 2. Permanent Cloud Firestore Deletion via deleteDoc
  let success = false;
  try {
    const orderRef = doc(db, 'orders', targetDocId);
    await deleteDoc(orderRef);
    console.log(`[Firebase Delete Order] Successfully executed deleteDoc on orders/${targetDocId}`);
    success = true;
  } catch (error) {
    console.error(`[Firebase Delete Order] Error executing deleteDoc on orders/${targetDocId}:`, error);
    handleFirestoreError(error, OperationType.DELETE, `orders/${targetDocId}`);
  }

  // 3. Fallback cleanup: Check if any document has field id == targetDocId or orderNumber == targetDocId
  try {
    const qField = query(collection(db, 'orders'), where('id', '==', targetDocId));
    const snapField = await getDocs(qField);
    for (const d of snapField.docs) {
      if (d.id !== targetDocId) {
        console.log(`[Firebase Delete Order] Also deleting matching id field doc: orders/${d.id}`);
        await deleteDoc(doc(db, 'orders', d.id));
      }
    }

    const qNum = query(collection(db, 'orders'), where('orderNumber', '==', targetDocId));
    const snapNum = await getDocs(qNum);
    for (const d of snapNum.docs) {
      if (d.id !== targetDocId) {
        console.log(`[Firebase Delete Order] Also deleting matching orderNumber doc: orders/${d.id}`);
        await deleteDoc(doc(db, 'orders', d.id));
      }
    }
  } catch (cleanupErr) {
    console.warn('[Firebase Delete Order] Secondary cleanup warning:', cleanupErr);
  }

  return success;
};

// ============================================================================
// REAL-TIME FIRESTORE SYNCHRONIZATION LISTENER
// ============================================================================

let isInitialized = false;

export const initFirestoreRealtimeSync = () => {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // 1. Sync Products Real-Time Listener - Strictly limited to 12 documents to prevent mass document reads
  try {
    const productsCol = collection(db, 'products');
    const initialProductsQuery = query(productsCol, limit(12));
    onSnapshot(initialProductsQuery, (snapshot) => {
      safeLocalStorage.setItem('allio_products_seeded', 'true');

      if (snapshot.empty) {
        // If Firestore is empty (e.g. user deleted all products), KEEP IT EMPTY. Never auto-reseed dummy products!
        safeLocalStorage.setItem(PRODUCTS_KEY, JSON.stringify([]));
        window.dispatchEvent(new CustomEvent('allio_products_updated', { detail: [] }));
        window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'products', data: [] } }));
        return;
      }

      const remoteProducts: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        // CRITICAL: Bind id directly to docSnap.id to ensure the true Firebase document ID is used
        remoteProducts.push({
          ...data,
          id: docSnap.id
        });
      });

      // Sort by creation date
      remoteProducts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      safeLocalStorage.setItem(PRODUCTS_KEY, JSON.stringify(remoteProducts));
      window.dispatchEvent(new CustomEvent('allio_products_updated', { detail: remoteProducts }));
      window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'products', data: remoteProducts } }));
    }, (error) => {
      if (error && (error.code === 'unavailable' || error.message.includes('offline'))) {
        console.warn('[Firestore Sync] Products listener operating in offline cache mode:', error.message);
      } else {
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    });
  } catch (err) {
    console.error('Error starting products realtime listener', err);
  }

  // 2. Sync Orders Real-Time Listener - Strictly limited to last 30 days to protect Firebase Free Tier limits!
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const ordersCol = collection(db, 'orders');
    // FREE TIER OPTIMIZATION: Only fetch orders from the last 30 days
    const recentOrdersQuery = query(
      ordersCol,
      where('createdAt', '>=', thirtyDaysAgoISO)
    );

    const parseOrderDoc = (docSnap: any): Order => {
      const data = docSnap.data();
      let createdAtStr = new Date().toISOString();
      if (data.createdAt) {
        if (typeof data.createdAt === 'string') {
          createdAtStr = data.createdAt;
        } else if (typeof data.createdAt.toDate === 'function') {
          createdAtStr = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'number') {
          createdAtStr = new Date(data.createdAt).toISOString();
        }
      }

      return {
        id: docSnap.id,
        orderNumber: data.orderNumber || ('AL-' + docSnap.id.slice(-4)),
        storeId: data.storeId || 'store-default',
        productId: data.productId || '',
        productName: data.productName || 'منتج',
        customerName: data.customerName || 'زبون',
        phoneNumber: data.phoneNumber || '',
        city: data.city || 'الدار البيضاء',
        address: data.address || '',
        quantity: Number(data.quantity) || 1,
        unitPrice: Number(data.unitPrice) || 0,
        shippingFee: Number(data.shippingFee) || 0,
        totalPrice: Number(data.totalPrice) || 0,
        status: data.status || 'new',
        notes: data.notes || '',
        createdAt: createdAtStr,
        updatedAt: data.updatedAt || createdAtStr,
        fbPixelFired: Boolean(data.fbPixelFired),
        tiktokPixelFired: Boolean(data.tiktokPixelFired)
      };
    };

    onSnapshot(recentOrdersQuery, (snapshot) => {
      safeLocalStorage.setItem('allio_orders_seeded', 'true');

      if (snapshot.empty) {
        // Only clear if local storage doesn't have newer orders or if truly empty
        safeLocalStorage.setItem(ORDERS_KEY, JSON.stringify([]));
        invalidateCache('dashboard_stats');
        window.dispatchEvent(new CustomEvent('allio_orders_updated', { detail: [] }));
        window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'orders', data: [] } }));
        return;
      }

      const remoteOrders: Order[] = [];
      snapshot.forEach((docSnap) => {
        remoteOrders.push(parseOrderDoc(docSnap));
      });

      // Sort by creation date (newest first)
      remoteOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      safeLocalStorage.setItem(ORDERS_KEY, JSON.stringify(remoteOrders));
      invalidateCache('dashboard_stats');
      window.dispatchEvent(new CustomEvent('allio_orders_updated', { detail: remoteOrders }));
      window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'orders', data: remoteOrders } }));
    }, (error) => {
      console.warn('[Firestore Sync] Notice on 30-day range query, activating fallback listener:', error.message);
      // Fallback: Query up to 50 latest orders without range restriction to guarantee no orders are hidden
      try {
        const fallbackQuery = query(ordersCol, limit(50));
        onSnapshot(fallbackQuery, (fallbackSnap) => {
          if (!fallbackSnap.empty) {
            const fallbackOrders: Order[] = [];
            fallbackSnap.forEach((docSnap) => {
              fallbackOrders.push(parseOrderDoc(docSnap));
            });
            fallbackOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            safeLocalStorage.setItem(ORDERS_KEY, JSON.stringify(fallbackOrders));
            invalidateCache('dashboard_stats');
            window.dispatchEvent(new CustomEvent('allio_orders_updated', { detail: fallbackOrders }));
            window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'orders', data: fallbackOrders } }));
          }
        }, (fbErr) => {
          handleFirestoreError(fbErr, OperationType.LIST, 'orders');
        });
      } catch (secErr) {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    });
  } catch (err) {
    console.error('Error starting orders realtime listener', err);
  }

  // 3. Sync Stores Real-Time Listener (Multi-Store / Multi-Niche)
  try {
    const storesCol = collection(db, 'stores');
    onSnapshot(storesCol, (snapshot) => {
      if (snapshot.empty) {
        // Seed initial default store to Firestore
        const defaultStore = DEFAULT_STORE;
        setDoc(doc(db, 'stores', defaultStore.id), defaultStore).catch(() => {});
        safeLocalStorage.setItem(STORES_KEY, JSON.stringify([defaultStore]));
        window.dispatchEvent(new CustomEvent('allio_stores_updated', { detail: [defaultStore] }));
        return;
      }

      const remoteStores: Store[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Store;
        remoteStores.push({
          ...data,
          id: docSnap.id
        });
      });

      remoteStores.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      safeLocalStorage.setItem(STORES_KEY, JSON.stringify(remoteStores));
      window.dispatchEvent(new CustomEvent('allio_stores_updated', { detail: remoteStores }));
      window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'stores', data: remoteStores } }));
    }, (error) => {
      if (error && (error.code === 'unavailable' || error.message.includes('offline'))) {
        console.warn('[Firestore Sync] Stores listener operating in offline cache mode:', error.message);
      } else {
        handleFirestoreError(error, OperationType.LIST, 'stores');
      }
    });
  } catch (err) {
    console.error('Error starting stores realtime listener', err);
  }
};

/**
 * On-demand fetcher for archived orders older than 30 days.
 * Only called if the admin explicitly clicks "تحميل الطلبات المؤرشفة" in OrdersManager.
 */
export const fetchArchivedOrders = async (maxLimit: number = 50): Promise<Order[]> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const q = query(
      collection(db, 'orders'),
      where('createdAt', '<', thirtyDaysAgoISO),
      limit(maxLimit)
    );
    const snap = await getDocs(q);
    const older: Order[] = [];
    snap.forEach((d) => {
      older.push({ ...(d.data() as Order), id: d.id });
    });
    return older;
  } catch (error) {
    console.warn('[Firestore] Error fetching archived orders:', error);
    return [];
  }
};

/**
 * Direct on-demand Firestore refresh for current orders.
 * Ensures the admin dashboard can force-sync directly from the cloud.
 */
export const refreshOrdersFromFirestore = async (): Promise<Order[]> => {
  try {
    const q = query(collection(db, 'orders'), limit(50));
    const snap = await getDocs(q);
    const remoteOrders: Order[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as any;
      let createdAtStr = new Date().toISOString();
      if (data.createdAt) {
        if (typeof data.createdAt === 'string') createdAtStr = data.createdAt;
        else if (typeof data.createdAt.toDate === 'function') createdAtStr = data.createdAt.toDate().toISOString();
        else if (typeof data.createdAt === 'number') createdAtStr = new Date(data.createdAt).toISOString();
      }

      remoteOrders.push({
        id: docSnap.id,
        orderNumber: data.orderNumber || ('AL-' + docSnap.id.slice(-4)),
        storeId: data.storeId || 'store-default',
        productId: data.productId || '',
        productName: data.productName || 'منتج',
        customerName: data.customerName || 'زبون',
        phoneNumber: data.phoneNumber || '',
        city: data.city || 'الدار البيضاء',
        address: data.address || '',
        quantity: Number(data.quantity) || 1,
        unitPrice: Number(data.unitPrice) || 0,
        shippingFee: Number(data.shippingFee) || 0,
        totalPrice: Number(data.totalPrice) || 0,
        status: data.status || 'new',
        notes: data.notes || '',
        createdAt: createdAtStr,
        updatedAt: data.updatedAt || createdAtStr,
        fbPixelFired: Boolean(data.fbPixelFired),
        tiktokPixelFired: Boolean(data.tiktokPixelFired)
      });
    });

    remoteOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    safeLocalStorage.setItem(ORDERS_KEY, JSON.stringify(remoteOrders));
    invalidateCache('dashboard_stats');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('allio_orders_updated', { detail: remoteOrders }));
      window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'orders', data: remoteOrders } }));
    }
    return remoteOrders;
  } catch (err) {
    console.warn('[Firestore] Error on direct refreshOrdersFromFirestore:', err);
    return getOrders();
  }
};


export const getDashboardStats = (ordersInput?: Order[]): DashboardStats => {
  // If not custom orders input, check in-memory cache first to avoid recomputation
  if (!ordersInput) {
    const cached = getFromCache<DashboardStats>('dashboard_stats');
    if (cached) return cached;
  }

  const allOrders = ordersInput || getOrders();
  
  // Filter for last 30 days to strictly protect Firebase Free Tier limits
  const thirtyDaysAgoTime = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const orders = allOrders.filter(o => {
    const t = new Date(o.createdAt).getTime();
    return isNaN(t) || t >= thirtyDaysAgoTime;
  });

  const totalOrders = orders.length;
  const newOrders = orders.filter(o => o.status === 'new').length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped' || o.status === 'delivered').length;
  
  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const averageOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
  
  // Calculated purely from orders: percentage of orders that are confirmed, shipped, or delivered
  const successfulCount = confirmedOrders + shippedOrders;
  const conversionRate = totalOrders > 0 ? Math.round((successfulCount / totalOrders) * 100) : 0;

  const result: DashboardStats = {
    totalOrders,
    newOrders,
    confirmedOrders,
    shippedOrders,
    totalRevenue,
    conversionRate,
    averageOrderValue
  };

  if (!ordersInput) {
    setInCache('dashboard_stats', result, DEFAULT_CACHE_TTL);
  }

  return result;
};

export const formatMoroccanPhoneForWhatsApp = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '212' + digits.substring(1);
  }
  if (digits.startsWith('212')) {
    return digits;
  }
  return '212' + digits;
};

export const generateWhatsAppConfirmLink = (order: Order): string => {
  const waNumber = formatMoroccanPhoneForWhatsApp(order.phoneNumber);
  const message = `السلام عليكم ورحمة الله، أخي/أختي ${order.customerName} 👋
معاك فريق متجر allio بخصوص طلبكم رقم (${order.orderNumber}):
📦 المنتج: ${order.productName}
💰 المبلغ الإجمالي: ${order.totalPrice} درهم مغربي (الدفع عند الاستلام)
🚚 العنوان المسجل: ${order.address} - ${order.city}

واش نأكدو ليك الإرسالية باش نجهزوها مع الموزع للتوصيل السريع؟`;

  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
};

export const exportOrdersToExcelCSV = (orders: Order[]) => {
  const headers = [
    'رقم الطلب',
    'اسم الزبون',
    'رقم الهاتف',
    'المدينة',
    'العنوان السكني',
    'المنتج',
    'الكمية',
    'سعر الوحدة (درهم)',
    'مصاريف الشحن',
    'المجموع (درهم)',
    'حالة الطلب',
    'تاريخ الطلب',
    'ملاحظات'
  ];

  const statusLabels: Record<OrderStatus, string> = {
    new: 'جديد',
    confirmed: 'تم التأكيد',
    shipped: 'شحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغي'
  };

  const rows = orders.map(o => [
    `"${o.orderNumber}"`,
    `"${o.customerName.replace(/"/g, '""')}"`,
    `"${o.phoneNumber}"`,
    `"${o.city.replace(/"/g, '""')}"`,
    `"${o.address.replace(/"/g, '""')}"`,
    `"${o.productName.replace(/"/g, '""')}"`,
    o.quantity,
    o.unitPrice,
    o.shippingFee,
    o.totalPrice,
    `"${statusLabels[o.status] || o.status}"`,
    `"${new Date(o.createdAt).toLocaleString('fr-FR')}"`,
    `"${(o.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `allio_orders_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

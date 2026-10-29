import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  useParams, 
  useNavigate, 
  Navigate 
} from 'react-router-dom';
import { Product, Order, Store, LocalizedString } from './types';
import { 
  getProducts, 
  getOrders, 
  getDashboardStats, 
  saveProduct, 
  initFirestoreRealtimeSync, 
  getStores, 
  getStoreById,
  fetchProductBySlug,
  refreshLandingPagesFromFirestore,
  refreshStoresFromFirestore,
  refreshOrdersFromFirestore
} from './lib/storage';
import { isAuthenticated, getAdminUser, logoutAdmin } from './lib/auth';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { LandingPagesManager } from './components/dashboard/LandingPagesManager';
import { StoresManager } from './components/dashboard/StoresManager';
import { DesignEditor } from './components/dashboard/DesignEditor';
import { OrdersManager } from './components/dashboard/OrdersManager';
import { NewProductModal } from './components/dashboard/NewProductModal';
import { PixelEventDebugger } from './components/dashboard/PixelEventDebugger';
import { PublicProductLanding } from './components/landing/PublicProductLanding';
import { StorefrontCatalog } from './components/landing/StorefrontCatalog';
import { ProductNotFound } from './components/landing/ProductNotFound';
import { recordVisitorSession } from './lib/visitorTracking';
import { 
  Smartphone, Monitor, ExternalLink, ArrowRight, 
  Copy, Check, LogOut, Loader2 
} from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

/**
 * Main Application Shell with Global State & Synchronization
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <Analytics />
    </BrowserRouter>
  );
}

function AppContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [stats, setStats] = useState(getDashboardStats());
  const [isAuth, setIsAuth] = useState<boolean>(isAuthenticated());

  const refreshData = () => {
    const prods = getProducts();
    const ords = getOrders();
    const strs = getStores();
    setProducts(prods);
    setOrders(ords);
    setStores(strs);
    setStats(getDashboardStats());
    setIsAuth(isAuthenticated());
  };

  useEffect(() => {
    // Initialize live Firestore sync across all devices
    initFirestoreRealtimeSync();
    refreshData();

    // Proactively fetch and unblock existing data from Firestore collections
    refreshLandingPagesFromFirestore()
      .then((fetched) => {
        if (fetched && fetched.length > 0) {
          setProducts(fetched);
        }
      })
      .catch((err) => {
        console.error('[App Error] Failed to refresh landing pages on mount:', err);
      });

    refreshStoresFromFirestore()
      .then((fetchedStores) => {
        if (fetchedStores && fetchedStores.length > 0) {
          setStores(fetchedStores);
        }
      })
      .catch((err) => {
        console.error('[App Error] Failed to refresh stores on mount:', err);
      });

    refreshOrdersFromFirestore()
      .then((fetchedOrders) => {
        if (fetchedOrders && fetchedOrders.length > 0) {
          setOrders(fetchedOrders);
        }
      })
      .catch((err) => {
        console.error('[App Error] Failed to refresh orders on mount:', err);
      });

    const handleUpdate = () => {
      refreshData();
    };

    const handleAuthChange = () => {
      setIsAuth(isAuthenticated());
    };

    window.addEventListener('allio_products_updated', handleUpdate);
    window.addEventListener('allio_landing_pages_updated', handleUpdate);
    window.addEventListener('allio_orders_updated', handleUpdate);
    window.addEventListener('allio_stores_updated', handleUpdate);
    window.addEventListener('allio_data_updated', handleUpdate);
    window.addEventListener('allio_auth_changed', handleAuthChange);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('allio_products_updated', handleUpdate);
      window.removeEventListener('allio_landing_pages_updated', handleUpdate);
      window.removeEventListener('allio_orders_updated', handleUpdate);
      window.removeEventListener('allio_stores_updated', handleUpdate);
      window.removeEventListener('allio_data_updated', handleUpdate);
      window.removeEventListener('allio_auth_changed', handleAuthChange);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <Routes>
      {/* 1. Public Storefront Catalog */}
      <Route 
        path="/" 
        element={
          <StorefrontRoute 
            products={products}
            stores={stores}
            isAuth={isAuth} 
          />
        } 
      />

      {/* 2. Admin Panel - Exclusively on /admin */}
      <Route 
        path="/admin/*" 
        element={
          <AdminRoute 
            products={products}
            orders={orders}
            stores={stores}
            stats={stats}
            isAuth={isAuth}
            onAuthChange={refreshData}
            onDataChange={refreshData}
          />
        } 
      />

      {/* 3. Explicit /p/:slug routes for landing pages */}
      <Route 
        path="/p/:slug" 
        element={
          <DynamicLandingPageRoute 
            products={products}
            stores={stores}
            isAuth={isAuth} 
            onAuthChange={refreshData}
          />
        } 
      />

      {/* 4. Dynamic root /:slug for clean product landing pages (e.g. /smartwatch-ultra-max, /product-1) */}
      <Route 
        path="/:slug" 
        element={
          <DynamicLandingPageRoute 
            products={products}
            stores={stores}
            isAuth={isAuth} 
            onAuthChange={refreshData}
          />
        } 
      />

      {/* Fallback 404 */}
      <Route path="*" element={<ProductNotFound />} />
    </Routes>
  );
}

/**
 * Route Component: Storefront Home
 */
function StorefrontRoute({ 
  products, 
  stores, 
  isAuth 
}: { 
  products: Product[]; 
  stores: Store[]; 
  isAuth: boolean; 
}) {
  const navigate = useNavigate();
  const activeStore = stores.find(s => s.isDefault) || stores[0];

  useEffect(() => {
    recordVisitorSession({
      path: '/',
      storeId: activeStore?.id || 'store-default',
      pageTitle: activeStore?.name || 'متجر Allio'
    });
  }, [activeStore]);

  // If normal customer (unauthenticated), render ONLY clean storefront with no admin banner
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-50">
        <StorefrontCatalog
          products={products}
          store={activeStore}
          onSelectProduct={(prod) => navigate(`/${prod.slug}`)}
        />
      </div>
    );
  }

  // If authenticated Admin, show notification bar with shortcut back to /admin
  return (
    <div className="min-h-screen bg-slate-50">
      <aside aria-label="شريط تنبيه الإدارة" className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-emerald-400 font-semibold">
            وضع معاينة المشرف (Admin Mode): تتصفح المتجر العام كمدير. الزبائن لا يرون هذا الشريط.
          </span>
        </div>
        <button
          onClick={() => navigate('/admin')}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors cursor-pointer"
        >
          لوحة الإدارة (/admin)
        </button>
      </aside>

      <StorefrontCatalog
        products={products}
        store={activeStore}
        onSelectProduct={(prod) => navigate(`/${prod.slug}`)}
      />
    </div>
  );
}

/**
 * Route Component: Dynamic Individual Landing Page (/:slug or /p/:slug)
 */
function DynamicLandingPageRoute({ 
  products, 
  stores = [],
  isAuth, 
  onAuthChange 
}: { 
  products: Product[]; 
  stores?: Store[];
  isAuth: boolean; 
  onAuthChange: () => void; 
}) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [previewDeviceMode, setPreviewDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedLink, setCopiedLink] = useState(false);
  const [hideAdminBarTemporarily, setHideAdminBarTemporarily] = useState(false);

  // If someone somehow reaches /admin through this match, redirect to /admin
  if (slug === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const [individualProduct, setIndividualProduct] = useState<Product | null>(null);
  const [isFetchingSingle, setIsFetchingSingle] = useState(false);

  // Look up product in cached/synced list or from targeted single-document fetch
  const product = products.find(p => p.slug === slug || p.id === slug) || individualProduct;
  const parentStore = stores.find(s => s.id === product?.storeId) || (product?.storeId ? getStoreById(product.storeId) : stores[0]) || getStoreById();

  useEffect(() => {
    if (!product && slug) {
      setIsFetchingSingle(true);
      fetchProductBySlug(slug).then((fetched) => {
        if (fetched) {
          setIndividualProduct(fetched);
        }
        setIsFetchingSingle(false);
      });
    }
  }, [product, slug]);

  useEffect(() => {
    if (product) {
      const prodName = typeof product.name === 'string' ? product.name : (typeof product.name === 'object' ? (product.name as any)?.ar || 'صفحة هبوط' : 'صفحة هبوط');
      recordVisitorSession({
        path: `/${product.slug}`,
        storeId: product.storeId || 'store-default',
        pageTitle: prodName
      });
    }
  }, [product]);

  if (isFetchingSingle) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
        <p className="text-xs text-slate-500 font-bold">جاري تحميل صفحة المنتج...</p>
      </div>
    );
  }

  if (!product) {
    return <ProductNotFound slug={slug} />;
  }

  // =========================================================================
  // 1. NORMAL CUSTOMER VIEW (Unauthenticated)
  // When visited by a regular customer, the top admin preview bar is 100% hidden.
  // They see only the clean, ultra-fast public landing page.
  // =========================================================================
  if (!isAuth || hideAdminBarTemporarily) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Floating restore button ONLY if admin temporarily toggled clean view */}
        {isAuth && hideAdminBarTemporarily && (
          <button
            onClick={() => setHideAdminBarTemporarily(false)}
            title="إظهار شريط أدوات المشرف مجدداً"
            className="fixed bottom-4 left-4 z-50 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-emerald-400 border border-slate-700 rounded-full text-xs font-bold shadow-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>شريط المشرف</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1 rounded">إظهار</span>
          </button>
        )}

        <PublicProductLanding
          product={product}
          store={parentStore}
          onNavigateHome={() => navigate('/')}
        />
      </div>
    );
  }

  // =========================================================================
  // 2. ADMIN PREVIEW MODE (Authenticated Admin Only)
  // Shows testing tools: device toggles, unique URL, return to /admin, and customer view toggle
  // =========================================================================
  const handleCopyLandingUrl = () => {
    const url = `${window.location.origin}/${product.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAdminLogout = () => {
    if (window.confirm('هل تريد تسجيل الخروج لمعاينة الصفحة كزبون عادي؟')) {
      logoutAdmin();
      onAuthChange();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Admin Preview & Debug Bar - ONLY VISIBLE TO LOGGED-IN ADMINS */}
      <aside aria-label="شريط أدوات الإدارة" className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 flex items-center justify-between text-xs sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة للوحة الإدارة (/admin)</span>
          </button>
          
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-slate-400" dir="ltr">
            <span className="text-emerald-400 font-bold">Unique URL:</span>
            <span className="text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded">/{product.slug}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Device Viewport Toggle (Desktop / Mobile 4G) */}
          <div className="bg-slate-800 p-0.5 rounded-lg flex items-center gap-1">
            <button
              onClick={() => setPreviewDeviceMode('desktop')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                previewDeviceMode === 'desktop' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>حاسوب</span>
            </button>
            <button
              onClick={() => setPreviewDeviceMode('mobile')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                previewDeviceMode === 'mobile' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>هاتف 4G</span>
            </button>
          </div>

          {/* Copy Unique URL */}
          <button
            onClick={handleCopyLandingUrl}
            title="نسخ الرابط الفريد للحملة الإعلانية"
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">نسخ الرابط الفريد</span>
          </button>

          {/* Toggle Clean Customer View */}
          <button
            onClick={() => setHideAdminBarTemporarily(true)}
            title="إخفاء الشريط لمعاينة ما يراه الزبون العادي تماماً"
            className="px-2.5 py-1 bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60 rounded text-xs font-semibold cursor-pointer"
          >
            <span>معاينة كزبون عادي</span>
          </button>

          {/* Quick Logout to test unauthenticated customer state */}
          <button
            onClick={handleAdminLogout}
            title="تسجيل الخروج لمعاينة كزبون غير مسجل"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded-lg text-xs cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Landing Page Canvas */}
      <div className={`flex-1 ${previewDeviceMode === 'mobile' ? 'py-8 flex justify-center bg-slate-950' : 'bg-slate-50'}`}>
        {previewDeviceMode === 'mobile' ? (
          <div className="w-full max-w-[420px] bg-white rounded-[40px] shadow-2xl border-8 border-slate-800 overflow-hidden min-h-[820px] flex flex-col">
            <div className="bg-slate-900 py-1 px-6 flex justify-between items-center text-[10px] text-slate-400">
              <span>09:41</span>
              <div className="w-20 h-3.5 bg-black rounded-full" />
              <span>4G 🇲🇦</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PublicProductLanding
                product={product}
                store={parentStore}
                onNavigateHome={() => navigate('/')}
              />
            </div>
          </div>
        ) : (
          <PublicProductLanding
            product={product}
            store={parentStore}
            onNavigateHome={() => navigate('/')}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Route Component: Protected Admin Panel
 */
function AdminRoute({
  products,
  orders,
  stores,
  stats,
  isAuth,
  onAuthChange,
  onDataChange
}: {
  products: Product[];
  orders: Order[];
  stores: Store[];
  stats: ReturnType<typeof getDashboardStats>;
  isAuth: boolean;
  onAuthChange: () => void;
  onDataChange: () => void;
}) {
  const navigate = useNavigate();
  const [adminTab, setAdminTab] = useState<'overview' | 'stores' | 'products' | 'design' | 'orders'>('overview');
  const [designTargetStoreId, setDesignTargetStoreId] = useState<string | undefined>(undefined);
  const [designTargetProductId, setDesignTargetProductId] = useState<string | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPixelDebuggerOpen, setIsPixelDebuggerOpen] = useState(false);

  // If not authenticated, render secure Admin Login screen
  if (!isAuth) {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          onAuthChange();
        }}
        onNavigateToPublicStore={() => navigate('/')}
      />
    );
  }

  const handleSaveProduct = async (productData: Partial<Product> & { name: LocalizedString; price: number }) => {
    try {
      console.log('[App] Initiating saveProduct for landing page:', productData.slug || productData.id);
      const saved = await saveProduct(productData);
      console.log('[App] Successfully persisted landing page with ID:', saved.id);
      onDataChange();
      setEditingProduct(null);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('[App] Critical error inside handleSaveProduct:', error);
      throw error;
    }
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsCreateModalOpen(true);
  };

  return (
    <AdminLayout
      user={getAdminUser()}
      activeTab={adminTab}
      onSelectTab={(tab) => {
        setAdminTab(tab);
      }}
      onOpenCreateProduct={() => {
        setEditingProduct(null);
        setIsCreateModalOpen(true);
      }}
      onTogglePixelDebugger={() => setIsPixelDebuggerOpen(!isPixelDebuggerOpen)}
      onNavigateToPublicStore={() => navigate('/')}
      onLogout={() => {
        onAuthChange();
      }}
    >
      <div className="space-y-6">
        {/* Admin Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">
                {adminTab === 'overview' && 'لوحة التحكم والتحليلات'}
                {adminTab === 'stores' && 'إدارة المتاجر والنيشات (Stores / Niches)'}
                {adminTab === 'products' && 'إدارة صفحات الهبوط (Landing Pages)'}
                {adminTab === 'design' && 'محرر التصميم والمحتوى (Design & Content Editor)'}
                {adminTab === 'orders' && 'إدارة الطلبات الواردة (Orders)'}
              </h1>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                المسار الحصري: /admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              منصة allio لإدارة المتاجر، النيشات، صفحات الهبوط وتخصيص الواجهات في المغرب
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              <span>زيارة المتجر العام</span>
            </button>

            <button
              onClick={() => {
                setEditingProduct(null);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              + إنشاء صفحة هبوط جديدة
            </button>
          </div>
        </div>

        {/* Admin Tab 1: Overview */}
        {adminTab === 'overview' && (
          <DashboardOverview
            stats={stats}
            orders={orders}
            products={products}
            onNavigateToOrders={() => setAdminTab('orders')}
            onNavigateToProducts={() => setAdminTab('products')}
            onViewProduct={(p) => navigate(`/${p.slug}`)}
          />
        )}

        {/* Admin Tab 2: Stores Manager */}
        {adminTab === 'stores' && (
          <StoresManager
            stores={stores}
            products={products}
            onStoresChange={onDataChange}
            onNavigateToDesign={(storeId: string) => {
              setDesignTargetStoreId(storeId);
              setDesignTargetProductId(undefined);
              setAdminTab('design');
            }}
            onNavigateToLandingPages={(_storeId: string) => {
              setAdminTab('products');
            }}
          />
        )}

        {/* Admin Tab 3: Landing Pages Manager */}
        {adminTab === 'products' && (
          <LandingPagesManager
            products={products}
            stores={stores}
            onProductsChange={onDataChange}
            onOpenCreateModal={() => {
              setEditingProduct(null);
              setIsCreateModalOpen(true);
            }}
            onEditProduct={(product) => {
              setDesignTargetStoreId(product.storeId);
              setDesignTargetProductId(product.id);
              setAdminTab('design');
            }}
            onCustomizeDesign={(product) => {
              setDesignTargetStoreId(product.storeId);
              setDesignTargetProductId(product.id);
              setAdminTab('design');
            }}
            onOpenSettingsModal={handleOpenEdit}
            onViewLandingPage={(p) => navigate(`/${p.slug}`)}
          />
        )}

        {/* Admin Tab 4: Design & Content Editor */}
        {adminTab === 'design' && (
          <DesignEditor
            stores={stores}
            products={products}
            initialStoreId={designTargetStoreId}
            initialProductId={designTargetProductId}
            onDataChange={onDataChange}
            onViewProduct={(product: Product) => navigate(`/${product.slug}`)}
          />
        )}

        {/* Admin Tab 5: Orders Manager */}
        {adminTab === 'orders' && (
          <OrdersManager
            orders={orders}
            products={products}
            onOrdersChange={onDataChange}
          />
        )}
      </div>

      {/* Modal for Creating / Editing Landing Page */}
      <NewProductModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
        stores={stores}
      />

      {/* Pixel Event Inspector Drawer */}
      <PixelEventDebugger
        isOpen={isPixelDebuggerOpen}
        onClose={() => setIsPixelDebuggerOpen(false)}
      />
    </AdminLayout>
  );
}

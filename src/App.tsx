import React, { useState, useEffect, useCallback } from 'react';
import { Product, Order } from './types';
import { getProducts, getOrders, getDashboardStats, saveProduct } from './lib/storage';
import { isAuthenticated, getAdminUser } from './lib/auth';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { LandingPagesManager } from './components/dashboard/LandingPagesManager';
import { OrdersManager } from './components/dashboard/OrdersManager';
import { NewProductModal } from './components/dashboard/NewProductModal';
import { PixelEventDebugger } from './components/dashboard/PixelEventDebugger';
import { PublicProductLanding } from './components/landing/PublicProductLanding';
import { StorefrontCatalog } from './components/landing/StorefrontCatalog';
import { 
  Smartphone, Monitor, ExternalLink, ArrowRight, 
  Copy, Check 
} from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState(getDashboardStats());
  
  // Routing State
  // 'store' | 'landing' | 'admin'
  const [currentRoute, setCurrentRoute] = useState<'store' | 'landing' | 'admin'>('store');
  const [activeProductSlug, setActiveProductSlug] = useState<string | null>(null);

  // Admin Internal Navigation
  const [adminTab, setAdminTab] = useState<'overview' | 'products' | 'orders'>('overview');
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPixelDebuggerOpen, setIsPixelDebuggerOpen] = useState(false);

  // Admin Sandbox Preview Mode for Landing Pages
  const [previewDeviceMode, setPreviewDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedLink, setCopiedLink] = useState(false);

  const refreshData = () => {
    const prods = getProducts();
    const ords = getOrders();
    setProducts(prods);
    setOrders(ords);
    setStats(getDashboardStats());
    setIsAuth(isAuthenticated());
  };

  // Route Parser from URL pathname or hash
  const parseCurrentUrl = useCallback(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    // Check for /admin route
    if (path.startsWith('/admin') || hash === '#admin' || hash.startsWith('#admin')) {
      setCurrentRoute('admin');
      setActiveProductSlug(null);
      return;
    }

    // Check for /p/:slug or #p-:slug
    if (path.startsWith('/p/')) {
      const slug = path.replace('/p/', '').replace(/\/$/, '');
      if (slug) {
        setCurrentRoute('landing');
        setActiveProductSlug(slug);
        return;
      }
    } else if (hash.startsWith('#p-')) {
      const slug = hash.replace('#p-', '');
      if (slug) {
        setCurrentRoute('landing');
        setActiveProductSlug(slug);
        return;
      }
    }

    // Default: Public Storefront
    setCurrentRoute('store');
    setActiveProductSlug(null);
  }, []);

  useEffect(() => {
    refreshData();
    parseCurrentUrl();

    const handlePopState = () => {
      parseCurrentUrl();
      refreshData();
    };

    const handleHashChange = () => {
      parseCurrentUrl();
      refreshData();
    };

    const handleDataUpdated = () => {
      refreshData();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('allio_orders_updated', handleDataUpdated);
    window.addEventListener('allio_data_updated', handleDataUpdated);
    window.addEventListener('storage', handleDataUpdated);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('allio_orders_updated', handleDataUpdated);
      window.removeEventListener('allio_data_updated', handleDataUpdated);
      window.removeEventListener('storage', handleDataUpdated);
    };
  }, [parseCurrentUrl]);

  // Route Navigators
  const navigateToRoute = (route: 'store' | 'admin' | 'landing', slug?: string) => {
    refreshData();
    if (route === 'admin') {
      window.history.pushState({}, '', '/admin');
      setCurrentRoute('admin');
      setActiveProductSlug(null);
    } else if (route === 'landing' && slug) {
      window.history.pushState({}, '', `/p/${slug}`);
      setCurrentRoute('landing');
      setActiveProductSlug(slug);
    } else {
      window.history.pushState({}, '', '/');
      setCurrentRoute('store');
      setActiveProductSlug(null);
    }
  };

  const handleSaveProduct = (productData: Partial<Product> & { name: string; price: number }) => {
    saveProduct(productData);
    refreshData();
    setEditingProduct(null);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsCreateModalOpen(true);
  };

  const handleCopyLandingUrl = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Find active product for landing page
  const activeProduct = activeProductSlug
    ? products.find(p => p.slug === activeProductSlug || p.id === activeProductSlug) || products[0]
    : products[0];

  // =========================================================================
  // ROUTE 1: ADMIN PANEL (/admin) - STRICTLY PROTECTED & DISTINCT LAYOUT
  // =========================================================================
  if (currentRoute === 'admin') {
    // If not authenticated, render secure Admin Login screen
    if (!isAuth) {
      return (
        <AdminLogin
          onLoginSuccess={() => {
            setIsAuth(true);
            refreshData();
          }}
          onNavigateToPublicStore={() => navigateToRoute('store')}
        />
      );
    }

    // Authenticated: Render Distinct Executive Admin Layout
    return (
      <AdminLayout
        user={getAdminUser()}
        activeTab={adminTab}
        onSelectTab={(tab) => {
          setAdminTab(tab);
          refreshData();
        }}
        onOpenCreateProduct={() => {
          setEditingProduct(null);
          setIsCreateModalOpen(true);
        }}
        onTogglePixelDebugger={() => setIsPixelDebuggerOpen(!isPixelDebuggerOpen)}
        onNavigateToPublicStore={() => navigateToRoute('store')}
        onLogout={() => {
          setIsAuth(false);
          refreshData();
        }}
      >
        <div className="space-y-6">
          {/* Admin Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">
                  {adminTab === 'overview' && 'لوحة التحكم والتحليلات'}
                  {adminTab === 'products' && 'إدارة صفحات الهبوط (Landing Pages)'}
                  {adminTab === 'orders' && 'إدارة الطلبات الواردة (Orders)'}
                </h1>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  المسار المحمي: /admin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                نظام إدارة التجارة الإلكترونية والدفع عند الاستلام بالمغرب (منصة allio)
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateToRoute('store')}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                <span>زيارة المتجر العام</span>
              </button>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsCreateModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                + إنشاء صفحة منتج
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
              onViewProduct={(p) => navigateToRoute('landing', p.slug)}
            />
          )}

          {/* Admin Tab 2: Landing Pages Manager */}
          {adminTab === 'products' && (
            <LandingPagesManager
              products={products}
              onProductsChange={refreshData}
              onOpenCreateModal={() => {
                setEditingProduct(null);
                setIsCreateModalOpen(true);
              }}
              onEditProduct={handleOpenEdit}
              onViewLandingPage={(p) => navigateToRoute('landing', p.slug)}
            />
          )}

          {/* Admin Tab 3: Orders Manager */}
          {adminTab === 'orders' && (
            <OrdersManager
              orders={orders}
              onOrdersChange={refreshData}
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
        />

        {/* Pixel Event Inspector Drawer */}
        <PixelEventDebugger
          isOpen={isPixelDebuggerOpen}
          onClose={() => setIsPixelDebuggerOpen(false)}
        />
      </AdminLayout>
    );
  }

  // =========================================================================
  // ROUTE 2: PUBLIC LANDING PAGE (/p/:slug) - NO ADMIN BUTTON IN HEADER
  // =========================================================================
  if (currentRoute === 'landing' && activeProduct) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* If user is logged-in admin, show a subtle top admin toolbar so they can return to /admin */}
        {isAuth && (
          <aside aria-label="شريط أدوات الإدارة" className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 flex items-center justify-between text-xs sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateToRoute('admin')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة للوحة الإدارة (/admin)</span>
              </button>
              <span className="hidden sm:inline font-mono text-[11px] text-slate-400" dir="ltr">
                allio.shop/p/{activeProduct.slug}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-800 p-0.5 rounded-lg flex items-center gap-1">
                <button
                  onClick={() => setPreviewDeviceMode('desktop')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                    previewDeviceMode === 'desktop' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>حاسوب</span>
                </button>
                <button
                  onClick={() => setPreviewDeviceMode('mobile')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                    previewDeviceMode === 'mobile' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>هاتف 4G</span>
                </button>
              </div>

              <button
                onClick={() => handleCopyLandingUrl(activeProduct.slug)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">نسخ الرابط</span>
              </button>
            </div>
          </aside>
        )}

        {/* Public Product Landing Content */}
        <div className={`flex-1 ${previewDeviceMode === 'mobile' && isAuth ? 'py-8 flex justify-center bg-slate-950' : 'bg-slate-50'}`}>
          {previewDeviceMode === 'mobile' && isAuth ? (
            <div className="w-full max-w-[420px] bg-white rounded-[40px] shadow-2xl border-8 border-slate-800 overflow-hidden min-h-[820px] flex flex-col">
              <div className="bg-slate-900 py-1 px-6 flex justify-between items-center text-[10px] text-slate-400">
                <span>09:41</span>
                <div className="w-20 h-3.5 bg-black rounded-full" />
                <span>4G 🇲🇦</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <PublicProductLanding
                  product={activeProduct}
                  onNavigateHome={() => navigateToRoute('store')}
                />
              </div>
            </div>
          ) : (
            <PublicProductLanding
              product={activeProduct}
              onNavigateHome={() => navigateToRoute('store')}
            />
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // ROUTE 3: PUBLIC STOREFRONT CATALOG (/) - NO ADMIN BUTTON ANYWHERE
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50">
      {/* If logged-in admin, show discreet bar at the top */}
      {isAuth && (
        <aside aria-label="شريط تنبيه الإدارة" className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 flex items-center justify-between text-xs">
          <span className="text-emerald-400 font-semibold">
            أنت مسجل كمدير متجر. تظهر هنا واجهة الزبائن العامة كما يراها زوار الموقع.
          </span>
          <button
            onClick={() => navigateToRoute('admin')}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors"
          >
            لوحة الإدارة (/admin)
          </button>
        </aside>
      )}

      {/* Clean Public Storefront Catalog */}
      <StorefrontCatalog
        products={products}
        onSelectProduct={(prod) => navigateToRoute('landing', prod.slug)}
      />
    </div>
  );
}

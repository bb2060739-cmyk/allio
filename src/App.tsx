import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  useParams, 
  useNavigate, 
  Navigate 
} from 'react-router-dom';
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
import { ProductNotFound } from './components/landing/ProductNotFound';
import { 
  Smartphone, Monitor, ExternalLink, ArrowRight, 
  Copy, Check 
} from 'lucide-react';

/**
 * Main Application Shell with Global State & Synchronization
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState(getDashboardStats());
  const [isAuth, setIsAuth] = useState<boolean>(isAuthenticated());

  const refreshData = () => {
    const prods = getProducts();
    const ords = getOrders();
    setProducts(prods);
    setOrders(ords);
    setStats(getDashboardStats());
    setIsAuth(isAuthenticated());
  };

  useEffect(() => {
    refreshData();

    const handleUpdate = () => {
      refreshData();
    };

    window.addEventListener('allio_orders_updated', handleUpdate);
    window.addEventListener('allio_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('allio_orders_updated', handleUpdate);
      window.removeEventListener('allio_data_updated', handleUpdate);
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
            isAuth={isAuth} 
          />
        } 
      />

      {/* 4. Dynamic root /:slug for clean product landing pages (e.g. /smartwatch-ultra-max, /product-1) */}
      <Route 
        path="/:slug" 
        element={
          <DynamicLandingPageRoute 
            products={products} 
            isAuth={isAuth} 
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
function StorefrontRoute({ products, isAuth }: { products: Product[]; isAuth: boolean }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* If logged-in admin, show subtle notification bar */}
      {isAuth && (
        <aside aria-label="شريط تنبيه الإدارة" className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 flex items-center justify-between text-xs">
          <span className="text-emerald-400 font-semibold">
            أنت مسجل كمدير متجر. تتصفح الآن المتجر العام كما يراه الزبائن.
          </span>
          <button
            onClick={() => navigate('/admin')}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors cursor-pointer"
          >
            لوحة الإدارة (/admin)
          </button>
        </aside>
      )}

      <StorefrontCatalog
        products={products}
        onSelectProduct={(prod) => navigate(`/${prod.slug}`)}
      />
    </div>
  );
}

/**
 * Route Component: Dynamic Individual Landing Page (/:slug or /p/:slug)
 */
function DynamicLandingPageRoute({ products, isAuth }: { products: Product[]; isAuth: boolean }) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [previewDeviceMode, setPreviewDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedLink, setCopiedLink] = useState(false);

  // If someone somehow reaches /admin through this match, redirect to /admin
  if (slug === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Look up product by slug or id
  const product = products.find(p => p.slug === slug || p.id === slug);

  if (!product) {
    return <ProductNotFound slug={slug} />;
  }

  const handleCopyLandingUrl = () => {
    const url = `${window.location.origin}/${product.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* If logged-in admin, show top admin toolbar for testing and device switching */}
      {isAuth && (
        <aside aria-label="شريط أدوات الإدارة" className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 flex items-center justify-between text-xs sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة للوحة الإدارة (/admin)</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-slate-400" dir="ltr">
              <span className="text-emerald-400">Unique URL:</span>
              <span className="text-white font-bold">/{product.slug}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-0.5 rounded-lg flex items-center gap-1">
              <button
                onClick={() => setPreviewDeviceMode('desktop')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                  previewDeviceMode === 'desktop' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                <Monitor className="w-3 h-3" />
                <span>حاسوب</span>
              </button>
              <button
                onClick={() => setPreviewDeviceMode('mobile')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                  previewDeviceMode === 'mobile' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>هاتف 4G</span>
              </button>
            </div>

            <button
              onClick={handleCopyLandingUrl}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">نسخ الرابط الفريد</span>
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
                product={product}
                onNavigateHome={() => navigate('/')}
              />
            </div>
          </div>
        ) : (
          <PublicProductLanding
            product={product}
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
  stats,
  isAuth,
  onAuthChange,
  onDataChange
}: {
  products: Product[];
  orders: Order[];
  stats: ReturnType<typeof getDashboardStats>;
  isAuth: boolean;
  onAuthChange: () => void;
  onDataChange: () => void;
}) {
  const navigate = useNavigate();
  const [adminTab, setAdminTab] = useState<'overview' | 'products' | 'orders'>('overview');
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

  const handleSaveProduct = (productData: Partial<Product> & { name: string; price: number }) => {
    saveProduct(productData);
    onDataChange();
    setEditingProduct(null);
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
        onDataChange();
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
                {adminTab === 'products' && 'إدارة صفحات الهبوط (Landing Pages)'}
                {adminTab === 'orders' && 'إدارة الطلبات الواردة (Orders)'}
              </h1>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                المسار الحصري: /admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              منصة allio لإدارة صفحات الهبوط المتعددة وتتبع الحملات الإعلانية بالمغرب
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

        {/* Admin Tab 2: Landing Pages Manager */}
        {adminTab === 'products' && (
          <LandingPagesManager
            products={products}
            onProductsChange={onDataChange}
            onOpenCreateModal={() => {
              setEditingProduct(null);
              setIsCreateModalOpen(true);
            }}
            onEditProduct={handleOpenEdit}
            onViewLandingPage={(p) => navigate(`/${p.slug}`)}
          />
        )}

        {/* Admin Tab 3: Orders Manager */}
        {adminTab === 'orders' && (
          <OrdersManager
            orders={orders}
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
      />

      {/* Pixel Event Inspector Drawer */}
      <PixelEventDebugger
        isOpen={isPixelDebuggerOpen}
        onClose={() => setIsPixelDebuggerOpen(false)}
      />
    </AdminLayout>
  );
}

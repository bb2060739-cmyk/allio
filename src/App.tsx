import React, { useState, useEffect } from 'react';
import { Product, Order } from './types';
import { getProducts, getOrders, getDashboardStats, saveProduct } from './lib/storage';
import { Navbar } from './components/layout/Navbar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { LandingPagesManager } from './components/dashboard/LandingPagesManager';
import { OrdersManager } from './components/dashboard/OrdersManager';
import { NewProductModal } from './components/dashboard/NewProductModal';
import { PixelEventDebugger } from './components/dashboard/PixelEventDebugger';
import { PublicProductLanding } from './components/landing/PublicProductLanding';
import { StorefrontCatalog } from './components/landing/StorefrontCatalog';
import { 
  Smartphone, Monitor, ExternalLink, ArrowRight, 
  Copy, Check, Sparkles, Layers 
} from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState(getDashboardStats());
  const [currentTab, setCurrentTab] = useState<'overview' | 'products' | 'orders'>('overview');
  const [activeLandingProduct, setActiveLandingProduct] = useState<Product | null>(null);
  const [isStoreCatalogView, setIsStoreCatalogView] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPixelDebuggerOpen, setIsPixelDebuggerOpen] = useState(false);
  const [previewDeviceMode, setPreviewDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedLink, setCopiedLink] = useState(false);

  const refreshData = () => {
    const prods = getProducts();
    const ords = getOrders();
    setProducts(prods);
    setOrders(ords);
    setStats(getDashboardStats());
  };

  useEffect(() => {
    refreshData();

    // Check if initial hash corresponds to a product slug: e.g. #p-smartwatch-ultra-max
    const hash = window.location.hash;
    if (hash && hash.startsWith('#p-')) {
      const slug = hash.replace('#p-', '');
      const prods = getProducts();
      const match = prods.find(p => p.slug === slug || p.id === slug);
      if (match) {
        setActiveLandingProduct(match);
      }
    }
  }, []);

  const handleSaveProduct = (productData: Partial<Product> & { name: string; price: number }) => {
    saveProduct(productData);
    refreshData();
    setEditingProduct(null);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsCreateModalOpen(true);
  };

  const handleOpenLandingPreview = (product: Product) => {
    // Increment view count
    const updated = products.map(p => p.id === product.id ? { ...p, views: (p.views || 0) + 1 } : p);
    setProducts(updated);
    try {
      localStorage.setItem('allio_products', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setActiveLandingProduct(product);
    setIsStoreCatalogView(false);
    window.location.hash = `p-${product.slug}`;
  };

  const handleCloseLandingPreview = () => {
    setActiveLandingProduct(null);
    window.location.hash = '';
    refreshData();
  };

  const handleCopyLandingUrl = () => {
    if (!activeLandingProduct) return;
    const url = `https://allio.shop/p/${activeLandingProduct.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // If viewing a specific product landing page
  if (activeLandingProduct) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Device Preview & Sandbox Bar */}
        <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 flex items-center justify-between text-xs sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCloseLandingPreview}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 font-bold"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة للوحة التحكم</span>
            </button>

            {/* Simulated Domain Bar */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-950/80 rounded-lg border border-slate-800 text-slate-400 font-mono text-[11px]" dir="ltr">
              <span className="text-emerald-400">🔒 https://</span>
              <span className="text-white">allio.shop/p/{activeLandingProduct.slug}</span>
              <button
                onClick={handleCopyLandingUrl}
                className="hover:text-white transition-colors"
                title="نسخ الرابط"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Device Viewport Toggle (Desktop / Mobile 4G Experience) */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-0.5 rounded-lg flex items-center gap-1">
              <button
                onClick={() => setPreviewDeviceMode('desktop')}
                title="عرض شاشة الحاسوب"
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                  previewDeviceMode === 'desktop'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline">شاشة كاملة</span>
              </button>

              <button
                onClick={() => setPreviewDeviceMode('mobile')}
                title="عرض الهاتف الذكي (Mobile 4G)"
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                  previewDeviceMode === 'mobile'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>هاتف (4G)</span>
              </button>
            </div>

            <button
              onClick={() => setIsPixelDebuggerOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/60 transition-colors font-bold flex items-center gap-1"
            >
              <span>فحص البيكسل</span>
            </button>
          </div>
        </div>

        {/* Viewport Frame */}
        <div className={`flex-1 overflow-y-auto ${previewDeviceMode === 'mobile' ? 'py-8 flex justify-center bg-slate-950' : 'bg-slate-50'}`}>
          {previewDeviceMode === 'mobile' ? (
            <div className="w-full max-w-[420px] bg-white rounded-[40px] shadow-2xl border-8 border-slate-800 overflow-hidden min-h-[820px] flex flex-col">
              {/* Mobile Notch Bar */}
              <div className="bg-slate-900 py-1 px-6 flex justify-between items-center text-[10px] text-slate-400">
                <span>09:41</span>
                <div className="w-20 h-3.5 bg-black rounded-full" />
                <span>4G 🇲🇦</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <PublicProductLanding
                  product={activeLandingProduct}
                  onOpenDashboard={handleCloseLandingPreview}
                />
              </div>
            </div>
          ) : (
            <PublicProductLanding
              product={activeLandingProduct}
              onOpenDashboard={handleCloseLandingPreview}
            />
          )}
        </div>

        {/* Pixel Event Inspector Drawer */}
        <PixelEventDebugger
          isOpen={isPixelDebuggerOpen}
          onClose={() => setIsPixelDebuggerOpen(false)}
        />
      </div>
    );
  }

  // If viewing the Storefront Catalog
  if (isStoreCatalogView) {
    return (
      <div className="min-h-screen bg-slate-50">
        <StorefrontCatalog
          products={products}
          onSelectProduct={(prod) => handleOpenLandingPreview(prod)}
          onOpenDashboard={() => setIsStoreCatalogView(false)}
        />
      </div>
    );
  }

  // Default: Admin Dashboard View
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Navbar with 3-Zone Contract */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsStoreCatalogView(false);
        }}
        onOpenCreateModal={() => {
          setEditingProduct(null);
          setIsCreateModalOpen(true);
        }}
        onTogglePixelDebugger={() => setIsPixelDebuggerOpen(!isPixelDebuggerOpen)}
        onViewLiveStore={() => setIsStoreCatalogView(true)}
        isPublicStoreMode={isStoreCatalogView}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Welcome & Platform Info Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">
                {currentTab === 'overview' && 'لوحة التحكم والإحصائيات'}
                {currentTab === 'products' && 'إدارة صفحات الهبوط (Landing Pages)'}
                {currentTab === 'orders' && 'إدارة الطلبات الواردة (Orders)'}
              </h1>
              <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                الدفع عند الاستلام بالمغرب COD
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              منصة allio لإنشاء صفحات هبوط سريعة جداً للمنتجات مع تتبع بيكسل فيسبوك وتيك توك
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStoreCatalogView(true)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              <span>معاينة المتجر العام</span>
            </button>

            <button
              onClick={() => {
                setEditingProduct(null);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              + صفحة هبوط جديدة
            </button>
          </div>
        </div>

        {/* Tab 1: Overview & Stats */}
        {currentTab === 'overview' && (
          <DashboardOverview
            stats={stats}
            orders={orders}
            products={products}
            onNavigateToOrders={() => setCurrentTab('orders')}
            onNavigateToProducts={() => setCurrentTab('products')}
            onViewProduct={handleOpenLandingPreview}
          />
        )}

        {/* Tab 2: Landing Pages */}
        {currentTab === 'products' && (
          <LandingPagesManager
            products={products}
            onProductsChange={refreshData}
            onOpenCreateModal={() => {
              setEditingProduct(null);
              setIsCreateModalOpen(true);
            }}
            onEditProduct={handleOpenEdit}
            onViewLandingPage={handleOpenLandingPreview}
          />
        )}

        {/* Tab 3: Orders Management */}
        {currentTab === 'orders' && (
          <OrdersManager
            orders={orders}
            onOrdersChange={refreshData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-bold text-slate-700">
            allio © 2026 — منصة التجارة الإلكترونية والدفع عند الاستلام بالمغرب
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>تتبع بيكسل فيسبوك وتيك توك</span>
            <span>·</span>
            <span>استمارة طلب COD بالدرهم المغربي</span>
            <span>·</span>
            <span>تصدير الطلبات إلى Excel</span>
          </div>
        </div>
      </footer>

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
    </div>
  );
}

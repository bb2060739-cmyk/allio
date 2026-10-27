import React from 'react';
import { AdminUser, logoutAdmin } from '../../lib/auth';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { 
  BarChart3, Layers, ShoppingCart, Activity, 
  ExternalLink, LogOut, ShieldCheck, UserCheck,
  Store, Palette
} from 'lucide-react';

interface AdminLayoutProps {
  user: AdminUser;
  activeTab: 'overview' | 'stores' | 'products' | 'design' | 'orders';
  onSelectTab: (tab: 'overview' | 'stores' | 'products' | 'design' | 'orders') => void;
  onOpenCreateProduct: () => void;
  onTogglePixelDebugger: () => void;
  onNavigateToPublicStore: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  user,
  activeTab,
  onSelectTab,
  onOpenCreateProduct,
  onTogglePixelDebugger,
  onNavigateToPublicStore,
  onLogout,
  children
}) => {
  const handleLogout = () => {
    if (window.confirm('هل تريد بالتأكيد تسجيل الخروج من لوحة التحكم؟')) {
      logoutAdmin();
      onLogout();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col font-sans">
      {/* Top Administrative Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand & Administrative Lockup */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-emerald-400 font-sans tracking-tight">
                Allio<span className="text-white text-xs font-semibold px-1.5 py-0.5 mr-1.5 bg-slate-800 rounded border border-slate-700">Admin</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-[11px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>جلسة إدارة آمنة</span>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <nav className="flex items-center gap-1 md:gap-1.5 text-xs">
            <button
              onClick={() => onSelectTab('overview')}
              className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">التحليلات</span>
            </button>

            <button
              onClick={() => onSelectTab('stores')}
              className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'stores'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Store className="w-4 h-4" />
              <span className="hidden md:inline">المتاجر والنيشات</span>
            </button>

            <button
              onClick={() => onSelectTab('products')}
              className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden md:inline">صفحات الهبوط</span>
            </button>

            <button
              onClick={() => onSelectTab('design')}
              className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'design'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span className="hidden md:inline">محرر التصميم</span>
            </button>

            <button
              onClick={() => onSelectTab('orders')}
              className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden md:inline">إدارة الطلبات</span>
            </button>
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2">
            {/* Live Pixel Inspector Toggle */}
            <button
              onClick={onTogglePixelDebugger}
              title="مراقب أحداث البيكسل المباشر"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4" />
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Visit Public Storefront */}
            <button
              onClick={onNavigateToPublicStore}
              title="زيارة المتجر العام للزبائن"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>المتجر العام</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            {/* Admin User Info */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800 text-right">
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">{user.name}</span>
                <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{user.email}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="تسجيل الخروج"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Admin Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <span>allio Merchant Control Panel · المغرب</span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-emerald-600 font-bold">بوابة محمية ونظام مشفر</span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <span>الدفع عند الاستلام COD</span>
            <span>·</span>
            <span>تتبع أحداث فيسبوك وتيك توك</span>
            <span>·</span>
            <button
              onClick={onNavigateToPublicStore}
              className="hover:underline text-emerald-700 font-bold"
            >
              فتح المتجر العام (allio.shop)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

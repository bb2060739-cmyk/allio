import React from 'react';
import { Plus, Activity } from 'lucide-react';

interface NavbarProps {
  currentTab: 'overview' | 'products' | 'orders';
  onSelectTab: (tab: 'overview' | 'products' | 'orders') => void;
  onOpenCreateModal: () => void;
  onTogglePixelDebugger: () => void;
  onViewLiveStore: () => void;
  isPublicStoreMode: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateModal,
  onTogglePixelDebugger,
  onViewLiveStore,
  isPublicStoreMode
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element, 1 line) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectTab('overview')}
            className="text-2xl font-black tracking-tight text-emerald-600 font-sans hover:opacity-90 transition-opacity cursor-pointer"
          >
            Allio
          </button>
        </div>

        {/* Zone 2: 4-5 Concise Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <button
            onClick={() => onSelectTab('overview')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              !isPublicStoreMode && currentTab === 'overview'
                ? 'text-emerald-700 font-bold border-b-2 border-emerald-600 pb-0.5'
                : ''
            }`}
          >
            الإحصائيات
          </button>

          <button
            onClick={() => onSelectTab('products')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              !isPublicStoreMode && currentTab === 'products'
                ? 'text-emerald-700 font-bold border-b-2 border-emerald-600 pb-0.5'
                : ''
            }`}
          >
            صفحات الهبوط
          </button>

          <button
            onClick={() => onSelectTab('orders')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              !isPublicStoreMode && currentTab === 'orders'
                ? 'text-emerald-700 font-bold border-b-2 border-emerald-600 pb-0.5'
                : ''
            }`}
          >
            إدارة الطلبات
          </button>

          <button
            onClick={onViewLiveStore}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              isPublicStoreMode
                ? 'text-emerald-700 font-bold border-b-2 border-emerald-600 pb-0.5'
                : ''
            }`}
          >
            المتجر والصفحات العامة
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action & Pixel Debugger Tool */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onTogglePixelDebugger}
            title="فحص أحداث البيكسل"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-slate-50 transition-colors"
          >
            <Activity className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">إنشاء صفحة منتج</span>
            <span className="sm:hidden">صفحة جديدة</span>
          </button>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { DashboardStats, Order, Product } from '../../types';
import { 
  ShoppingBag, TrendingUp, Clock, Truck, 
  MapPin, CheckCircle, ExternalLink, ArrowUpRight 
} from 'lucide-react';

interface DashboardOverviewProps {
  stats: DashboardStats;
  orders: Order[];
  products: Product[];
  onNavigateToOrders: () => void;
  onNavigateToProducts: () => void;
  onViewProduct: (product: Product) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  orders,
  products,
  onNavigateToOrders,
  onNavigateToProducts,
  onViewProduct
}) => {
  // Compute city distribution
  const cityCountMap: Record<string, number> = {};
  orders.forEach(o => {
    cityCountMap[o.city] = (cityCountMap[o.city] || 0) + 1;
  });

  const sortedCities = Object.entries(cityCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 4 Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>إجمالي الإيرادات (المبيعات)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {stats.totalRevenue.toLocaleString('fr-FR')}{' '}
            <span className="text-xs font-semibold text-emerald-700">درهم DH</span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            المبيعات الصافية بعد خصم الطلبات الملغاة
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>إجمالي الطلبات الواردة</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {stats.totalOrders}{' '}
            <span className="text-xs font-semibold text-slate-500">طلبية</span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            متوسط قيمة السلة: {stats.averageOrderValue} درهم
          </span>
        </div>

        {/* New Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>طلبات جديدة (تحتاج تأكيد)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tabular-nums">
            {stats.newOrders}{' '}
            <span className="text-xs font-semibold text-slate-500">في الانتظار</span>
          </div>
          <span className="text-[11px] text-amber-700 block font-medium">
            تأكيد هاتفياً أو عبر الواتساب
          </span>
        </div>

        {/* Shipped / Delivered Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>نسبة التوصيل والشحن</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {stats.totalOrders > 0
              ? Math.round((stats.shippedOrders / stats.totalOrders) * 100)
              : 0}%
          </div>
          <span className="text-[11px] text-slate-400 block">
            {stats.shippedOrders} طلبية تم شحنها للموزعين
          </span>
        </div>
      </div>

      {/* 2-Column Split: Recent Orders & Top Moroccan Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Incoming Orders (Lg: 8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">آخر الطلبات المسجلة</h3>
              <p className="text-xs text-slate-500">طلبات واردة مباشرة من صفحات الهبوط الإعلانية</p>
            </div>
            <button
              onClick={onNavigateToOrders}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
            >
              <span>عرض كل الطلبات</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{order.customerName}</span>
                    <span className="text-xs font-mono text-slate-400">{order.orderNumber}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{order.productName}</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-medium">{order.city}</span>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <div className="font-bold text-sm text-slate-900">
                    {order.totalPrice} <span className="text-xs font-normal">DH</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                    order.status === 'new'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : order.status === 'confirmed'
                      ? 'bg-blue-50 text-blue-700'
                      : order.status === 'shipped'
                      ? 'bg-purple-50 text-purple-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {order.status === 'new' ? 'جديد ⏳' : order.status === 'confirmed' ? 'مؤكد ✓' : order.status === 'shipped' ? 'مشحون 🚚' : 'مسلّم 📦'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Top Moroccan Cities Distribution & Active Landing Pages (Lg: 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top Moroccan Cities */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>أكثر المدن طلباً بالمغرب</span>
            </h3>

            <div className="space-y-3">
              {sortedCities.map(([cityName, count]) => {
                const percentage = Math.round((count / Math.max(orders.length, 1)) * 100);
                return (
                  <div key={cityName} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cityName}</span>
                      <span className="text-slate-500">{count} طلب ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Product Landing Pages Quick List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">صفحات الهبوط النشطة</h3>
              <button
                onClick={onNavigateToProducts}
                className="text-xs text-emerald-600 font-bold"
              >
                إدارة
              </button>
            </div>

            <div className="space-y-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onViewProduct(p)}
                  className="p-2.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 line-clamp-1">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {p.price} DH · {p.salesCount} مبيعة
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

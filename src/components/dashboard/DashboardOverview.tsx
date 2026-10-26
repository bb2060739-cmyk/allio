import React, { useState, useMemo } from 'react';
import { DashboardStats, Order, Product } from '../../types';
import { 
  TrendingUp, 
  ShoppingBag, 
  Calculator, 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  ExternalLink, 
  AlertCircle,
  Database,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface DashboardOverviewProps {
  stats: DashboardStats;
  orders: Order[];
  products: Product[];
  onNavigateToOrders: () => void;
  onNavigateToProducts: () => void;
  onViewProduct: (product: Product) => void;
}

// Vibrant, accessible Moroccan palette for Pie slices & charts
const CITY_COLORS = [
  '#10B981', // Emerald (Casablanca)
  '#06B6D4', // Cyan (Rabat)
  '#3B82F6', // Blue (Marrakech)
  '#8B5CF6', // Purple (Tangier)
  '#F59E0B', // Amber (Fes)
  '#EC4899', // Pink (Agadir)
  '#14B8A6', // Teal (Meknes)
  '#64748B'  // Slate (Other)
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  orders,
  products,
  onNavigateToOrders,
  onNavigateToProducts,
  onViewProduct
}) => {
  // Chart and filter state - default to 30 days to strictly protect Firebase Free Tier limits
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'all'>('30days');
  const [statusFilter, setStatusFilter] = useState<'all' | 'successful'>('all');
  const [revenueGrouping, setRevenueGrouping] = useState<'daily' | 'weekly'>('daily');

  // ==========================================================================
  // 1. FILTER ORDERS IN-MEMORY (0 extra Firebase reads/writes)
  // ==========================================================================
  const filteredOrders = useMemo(() => {
    const now = new Date().getTime();

    return orders.filter(order => {
      // Status filter
      if (statusFilter === 'successful' && order.status === 'cancelled') {
        return false;
      }

      // Timeframe filter
      if (timeRange === 'all') return true;

      const orderTime = new Date(order.createdAt).getTime();
      if (isNaN(orderTime)) return true; // fallback for non-standard dates

      const diffDays = (now - orderTime) / (1000 * 60 * 60 * 24);
      if (timeRange === '7days') return diffDays <= 7;
      if (timeRange === '30days') return diffDays <= 30;

      return true;
    });
  }, [orders, timeRange, statusFilter]);

  // ==========================================================================
  // 2. SUMMARY METRICS (Top Cards)
  // ==========================================================================
  const metrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    
    // Revenue from valid orders (exclude cancelled from revenue calculation)
    const validOrdersForRevenue = filteredOrders.filter(o => o.status !== 'cancelled');
    const totalRevenue = validOrdersForRevenue.reduce((acc, o) => acc + (Number(o.totalPrice) || 0), 0);
    
    // Average Order Value
    const averageOrderValue = validOrdersForRevenue.length > 0 
      ? Math.round(totalRevenue / validOrdersForRevenue.length) 
      : 0;

    // Additional status counts
    const newOrdersCount = filteredOrders.filter(o => o.status === 'new').length;
    const confirmedCount = filteredOrders.filter(o => o.status === 'confirmed').length;
    const shippedCount = filteredOrders.filter(o => o.status === 'shipped').length;
    const deliveredCount = filteredOrders.filter(o => o.status === 'delivered').length;
    const cancelledCount = filteredOrders.filter(o => o.status === 'cancelled').length;

    const successfulCount = confirmedCount + shippedCount + deliveredCount;
    const deliveryRate = totalOrders > 0 ? Math.round((successfulCount / totalOrders) * 100) : 0;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      newOrdersCount,
      confirmedCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
      deliveryRate
    };
  }, [filteredOrders]);

  // ==========================================================================
  // 3. REVENUE OVER TIME (Line Chart Data - Daily / Weekly)
  // ==========================================================================
  const revenueChartData = useMemo(() => {
    if (filteredOrders.length === 0) return [];

    // Filter only non-cancelled orders for revenue
    const revenueOrders = filteredOrders.filter(o => o.status !== 'cancelled');
    if (revenueOrders.length === 0) return [];

    if (revenueGrouping === 'daily') {
      // Group by Day (YYYY-MM-DD)
      const dayMap: Record<string, { id: string; label: string; revenue: number; ordersCount: number }> = {};

      revenueOrders.forEach(o => {
        const d = new Date(o.createdAt);
        const dateKey = !isNaN(d.getTime()) 
          ? d.toISOString().split('T')[0] 
          : 'recent';
        
        const label = !isNaN(d.getTime())
          ? `${d.getDate()} / ${d.getMonth() + 1}`
          : 'مؤخراً';

        if (!dayMap[dateKey]) {
          dayMap[dateKey] = { id: dateKey, label, revenue: 0, ordersCount: 0 };
        }
        dayMap[dateKey].revenue += Number(o.totalPrice) || 0;
        dayMap[dateKey].ordersCount += 1;
      });

      // Sort chronologically
      return Object.values(dayMap).sort((a, b) => a.id.localeCompare(b.id));
    } else {
      // Group by Week
      const weekMap: Record<string, { id: string; label: string; revenue: number; ordersCount: number }> = {};

      revenueOrders.forEach(o => {
        const d = new Date(o.createdAt);
        if (isNaN(d.getTime())) return;

        // Calculate ISO week or week bucket
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d.getTime() - startOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        const weekKey = `${d.getFullYear()}-W${weekNum < 10 ? '0' + weekNum : weekNum}`;
        const label = `أسبوع ${weekNum}`;

        if (!weekMap[weekKey]) {
          weekMap[weekKey] = { id: weekKey, label, revenue: 0, ordersCount: 0 };
        }
        weekMap[weekKey].revenue += Number(o.totalPrice) || 0;
        weekMap[weekKey].ordersCount += 1;
      });

      return Object.values(weekMap).sort((a, b) => a.id.localeCompare(b.id));
    }
  }, [filteredOrders, revenueGrouping]);

  // ==========================================================================
  // 4. ORDERS OVER TIME (Bar Chart Data - Volume per Day)
  // ==========================================================================
  const ordersVolumeData = useMemo(() => {
    if (filteredOrders.length === 0) return [];

    const dayMap: Record<string, { date: string; label: string; orders: number; revenue: number }> = {};

    filteredOrders.forEach(o => {
      const d = new Date(o.createdAt);
      const dateKey = !isNaN(d.getTime()) 
        ? d.toISOString().split('T')[0] 
        : 'recent';
      
      const label = !isNaN(d.getTime())
        ? `${d.getDate()} / ${d.getMonth() + 1}`
        : 'مؤخراً';

      if (!dayMap[dateKey]) {
        dayMap[dateKey] = { date: dateKey, label, orders: 0, revenue: 0 };
      }
      dayMap[dateKey].orders += 1;
      if (o.status !== 'cancelled') {
        dayMap[dateKey].revenue += Number(o.totalPrice) || 0;
      }
    });

    return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

  // ==========================================================================
  // 5. TOP CITIES (Pie Chart Data - Most Successful Orders)
  // ==========================================================================
  const cityPieData = useMemo(() => {
    if (orders.length === 0) return [];

    // Focus on successful orders (confirmed, shipped, delivered)
    // If none are marked yet, fallback to all non-cancelled orders
    let targetOrders = orders.filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status));
    if (targetOrders.length === 0) {
      targetOrders = orders.filter(o => o.status !== 'cancelled');
    }
    if (targetOrders.length === 0) {
      targetOrders = orders; // fallback so empty state won't fail
    }

    const cityMap: Record<string, { count: number; revenue: number }> = {};
    targetOrders.forEach(o => {
      const city = o.city?.trim() || 'أخرى';
      if (!cityMap[city]) {
        cityMap[city] = { count: 0, revenue: 0 };
      }
      cityMap[city].count += 1;
      cityMap[city].revenue += Number(o.totalPrice) || 0;
    });

    const totalTarget = targetOrders.length;
    const sorted = Object.entries(cityMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
        percentage: totalTarget > 0 ? Math.round((data.count / totalTarget) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Take top 6 cities, combine remaining into "مدن أخرى"
    if (sorted.length <= 6) {
      return sorted;
    }

    const top5 = sorted.slice(0, 5);
    const rest = sorted.slice(5);
    const otherCount = rest.reduce((acc, c) => acc + c.count, 0);
    const otherRevenue = rest.reduce((acc, c) => acc + c.revenue, 0);
    const otherPercentage = totalTarget > 0 ? Math.round((otherCount / totalTarget) * 100) : 0;

    return [
      ...top5,
      {
        name: 'مدن أخرى',
        count: otherCount,
        revenue: otherRevenue,
        percentage: otherPercentage
      }
    ];
  }, [orders]);

  // Recent 5 orders for quick operational inspection
  const recentOrders = useMemo(() => {
    return [...orders].slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Free Tier In-Memory Analytics Assurance */}
      <div className="bg-emerald-950/60 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-emerald-100 flex items-center gap-2">
              <span>تحليلات وإحصائيات فورية (Free-Tier Safe)</span>
              <span className="bg-emerald-500/30 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                0 extra reads/writes
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/80 mt-0.5">
              يتم احتساب الرسوم البيانية والأرقام مباشرة من مجموعة الطلبات المسجلة دون إنشاء مجموعات تتبع إضافية.
            </p>
          </div>
        </div>

        {/* Global Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Filter */}
          <div className="bg-slate-900/90 border border-slate-700 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === '7days'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => setTimeRange('30days')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === '30days'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              آخر 30 يوماً (الافتراضي)
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              كل الأوقات
            </button>
          </div>

          {/* Status Filter */}
          <div className="bg-slate-900/90 border border-slate-700 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              كل الطلبات
            </button>
            <button
              onClick={() => setStatusFilter('successful')}
              title="استثناء الطلبات الملغاة"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'successful'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الناجحة فقط ✓
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1. TOP SUMMARY CARDS (Total Revenue, Total Orders, Average Order Value) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue (إجمالي الإيرادات) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold">إجمالي الإيرادات (Total Revenue)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            {metrics.totalRevenue.toLocaleString('fr-FR')}{' '}
            <span className="text-sm font-semibold text-emerald-600">درهم DH</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-100">
            <span>مجموع المبيعات الصافية</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              MAD 🇲🇦
            </span>
          </div>
        </div>

        {/* Card 2: Total Orders (إجمالي الطلبات) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold">إجمالي الطلبات (Total Orders)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            {metrics.totalOrders}{' '}
            <span className="text-sm font-semibold text-slate-500">طلبية</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-100">
            <span>
              {metrics.newOrdersCount > 0 ? (
                <span className="text-amber-600 font-bold">{metrics.newOrdersCount} بانتظار التأكيد</span>
              ) : (
                'كل الطلبات مراجعة'
              )}
            </span>
            <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
              {metrics.deliveredCount} مسلّمة
            </span>
          </div>
        </div>

        {/* Card 3: Average Order Value (متوسط قيمة الطلب) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold">متوسط قيمة الطلب (AOV)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calculator className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            {metrics.averageOrderValue.toLocaleString('fr-FR')}{' '}
            <span className="text-sm font-semibold text-amber-600">درهم / طلب</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-100">
            <span>معدل قيمة السلة للزبون</span>
            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
              متوسط السلة
            </span>
          </div>
        </div>

        {/* Card 4: Success & Delivery Rate (معدل النجاح والتوصيل) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold">معدل التوصيل والنجاح</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            {metrics.deliveryRate}%
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-100">
            <span>طلبات مؤكدة ومسلّمة</span>
            <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full">
              {metrics.shippedCount + metrics.deliveredCount} بالشحن
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. RECHARTS VISUALIZATIONS SECTION */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: Revenue Over Time (Line Chart) - lg:col-span-7 */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>تطور الإيرادات عبر الوقت (Revenue Over Time)</span>
              </h3>
              <p className="text-xs text-slate-500">
                مجموع المبالغ المحققة بناءً على تواريخ الطلبات بالدرهم المغربي
              </p>
            </div>

            {/* Daily / Weekly Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 self-start sm:self-auto">
              <button
                onClick={() => setRevenueGrouping('daily')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  revenueGrouping === 'daily'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                يومي (Daily)
              </button>
              <button
                onClick={() => setRevenueGrouping('weekly')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  revenueGrouping === 'weekly'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                أسبوعي (Weekly)
              </button>
            </div>
          </div>

          {revenueChartData.length > 0 ? (
            <div className="h-[280px] w-full pt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="label" 
                    stroke="#94A3B8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis 
                    stroke="#94A3B8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `${val} DH`}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 space-y-1.5" dir="rtl">
                            <p className="font-bold text-slate-300">{label}</p>
                            <p className="font-bold text-emerald-400 flex items-center justify-between gap-4">
                              <span>المداخيل:</span>
                              <span className="font-mono text-sm">{item.revenue?.toLocaleString()} DH</span>
                            </p>
                            <p className="text-slate-400 flex items-center justify-between gap-4 text-[11px]">
                              <span>عدد الطلبيات:</span>
                              <span>{item.ordersCount} طلب</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="الإيرادات (DH)"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 7, stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <BarChart2 className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">لا توجد مبيعات مسجلة في هذا النطاق</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                ستظهر أرقام وتطور المداخيل اليومية فور تسجيل أي طلبية جديدة عبر صفحات الهبوط.
              </p>
            </div>
          )}
        </div>

        {/* CHART 3: Top Moroccan Cities (Pie Chart) - lg:col-span-5 */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-emerald-600" />
                <span>أعلى المدن طلباً (Top Cities)</span>
              </h3>
              <p className="text-xs text-slate-500">
                توزيع الطلبيات الناجحة بحسب المدن المغربية
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              نسبة النجاح
            </span>
          </div>

          {cityPieData.length > 0 ? (
            <div className="space-y-4">
              <div className="h-[200px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 space-y-1" dir="rtl">
                              <p className="font-bold text-emerald-400">{data.name}</p>
                              <p className="text-slate-300 flex justify-between gap-4">
                                <span>عدد الطلبات:</span>
                                <span className="font-bold font-mono">{data.count} طلب</span>
                              </p>
                              <p className="text-slate-300 flex justify-between gap-4">
                                <span>إجمالي المبيعات:</span>
                                <span className="font-bold font-mono text-emerald-300">{data.revenue?.toLocaleString()} DH</span>
                              </p>
                              <p className="text-slate-400 flex justify-between gap-4 text-[11px]">
                                <span>النسبة:</span>
                                <span className="font-bold">{data.percentage}%</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={cityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="name"
                    >
                      {cityPieData.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CITY_COLORS[index % CITY_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* City Legend & Distribution Breakdown */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 max-h-[120px] overflow-y-auto">
                {cityPieData.map((city, idx) => (
                  <div key={city.name} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: CITY_COLORS[idx % CITY_COLORS.length] }} 
                      />
                      <span className="font-semibold text-slate-800 truncate">{city.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0 font-bold">
                      {city.count} ({city.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <MapPin className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">لا توجد بيانات مدن كافية</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                سيتم تصنيف المدن المغربية تلقائياً عند استلام أول طلبية.
              </p>
            </div>
          )}
        </div>

        {/* CHART 2: Orders Over Time (Bar Chart) - Full Width (lg:col-span-12) */}
        <div className="lg:col-span-12 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <span>حجم الطلبات عبر الأيام (Orders Volume Over Time)</span>
              </h3>
              <p className="text-xs text-slate-500">
                مخطط شريطي يوضح كثافة وعدد الطلبيات الواردة يومياً عبر مختلف صفحات الهبوط
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
                <span>عدد الطلبيات</span>
              </span>
            </div>
          </div>

          {ordersVolumeData.length > 0 ? (
            <div className="h-[250px] w-full pt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersVolumeData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="label" 
                    stroke="#94A3B8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#CBD5E1' }} 
                  />
                  <YAxis 
                    stroke="#94A3B8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 space-y-1.5" dir="rtl">
                            <p className="font-bold text-slate-300">{label}</p>
                            <p className="font-bold text-blue-400 flex items-center justify-between gap-4">
                              <span>حجم الطلبيات:</span>
                              <span className="font-mono text-sm">{item.orders} طلب</span>
                            </p>
                            <p className="text-slate-400 flex items-center justify-between gap-4 text-[11px]">
                              <span>قيمة مبيعات اليوم:</span>
                              <span className="font-mono">{item.revenue?.toLocaleString()} DH</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="orders" 
                    name="عدد الطلبات" 
                    fill="#3B82F6" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <ShoppingBag className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">لا توجد طلبات مسجلة بعد</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                عند وصول طلبات جديدة من الزبائن سيتم رسم حجم التدفق اليومي هنا تلقائياً.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. RECENT ORDERS & QUICK LANDING PAGE MONITORING */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders List (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">آخر الطلبات المسجلة</h3>
              <p className="text-xs text-slate-500">طلبات واردة مباشرة من صفحات الهبوط الإعلانية</p>
            </div>
            <button
              onClick={onNavigateToOrders}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>عرض وإدارة كل الطلبات</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentOrders.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 truncate">{order.customerName}</span>
                      <span className="text-xs font-mono text-slate-400 shrink-0">{order.orderNumber}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 truncate">
                      <span className="truncate">{order.productName}</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-medium shrink-0">{order.city}</span>
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
                        : order.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {order.status === 'new' ? 'جديد ⏳' : 
                       order.status === 'confirmed' ? 'مؤكد ✓' : 
                       order.status === 'shipped' ? 'مشحون 🚚' : 
                       order.status === 'delivered' ? 'مسلّم 📦' : 'ملغي ✕'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              لا توجد طلبات حديثة في السجل
            </div>
          )}
        </div>

        {/* Active Landing Pages Monitor (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">صفحات الهبوط النشطة</h3>
            <button
              onClick={onNavigateToProducts}
              className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
            >
              إدارة الكل
            </button>
          </div>

          {products.length > 0 ? (
            <div className="space-y-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onViewProduct(p)}
                  className="p-2.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 truncate">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {p.price} DH · {p.salesCount || 0} مبيعة
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              لا توجد صفحات هبوط مضافة بعد
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

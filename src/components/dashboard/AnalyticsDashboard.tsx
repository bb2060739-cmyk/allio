import React, { useState, useMemo } from 'react';
import { Order } from '../../types';
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
  Tooltip,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  ShoppingBag, 
  CreditCard, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  BarChart3, 
  ArrowUpRight,
  Info
} from 'lucide-react';

interface AnalyticsDashboardProps {
  orders: Order[];
  onNavigateToOrders?: () => void;
}

type TimeframeOption = '7days' | '14days' | '30days' | 'all';
type RevenueInterval = 'daily' | 'weekly';

// Vibrant, harmonious palette for Moroccan cities pie chart
const CITY_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#64748b'  // Slate for 'Other'
];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  orders,
  onNavigateToOrders 
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('30days');
  const [revenueInterval, setRevenueInterval] = useState<RevenueInterval>('daily');

  // --------------------------------------------------------------------------
  // 1. KPI SUMMARY CALCULATIONS (Pure in-memory aggregation, ZERO Firebase cost)
  // --------------------------------------------------------------------------
  const metrics = useMemo(() => {
    const totalOrders = orders.length;

    // Successful orders: all orders not explicitly cancelled
    const successfulOrders = orders.filter(o => o.status !== 'cancelled');
    const successfulCount = successfulOrders.length;

    // Total Revenue from valid orders
    const totalRevenue = successfulOrders.reduce((acc, o) => acc + (Number(o.totalPrice) || 0), 0);

    // Average Order Value
    const averageOrderValue = successfulCount > 0 ? Math.round(totalRevenue / successfulCount) : 0;

    // Success rate
    const successRate = totalOrders > 0 ? Math.round((successfulCount / totalOrders) * 100) : 0;

    // Delivered & Shipped counts
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    const shippedCount = orders.filter(o => o.status === 'shipped').length;
    const newCount = orders.filter(o => o.status === 'new').length;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      successfulCount,
      successRate,
      deliveredCount,
      shippedCount,
      newCount
    };
  }, [orders]);

  // --------------------------------------------------------------------------
  // 2. TIMEFRAME FILTERED ORDERS
  // --------------------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    if (timeframe === 'all') return orders;

    const now = new Date().getTime();
    const days = timeframe === '7days' ? 7 : timeframe === '14days' ? 14 : 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt).getTime();
      return !isNaN(orderDate) && orderDate >= cutoff;
    });
  }, [orders, timeframe]);

  // --------------------------------------------------------------------------
  // 3. REVENUE OVER TIME (Daily / Weekly aggregation)
  // --------------------------------------------------------------------------
  const revenueChartData = useMemo(() => {
    if (orders.length === 0) return [];

    if (revenueInterval === 'weekly') {
      // Group by calendar week (e.g., Week YYYY-WW)
      const weekMap: Record<string, { label: string; revenue: number; ordersCount: number; timestamp: number }> = {};

      filteredOrders.forEach(order => {
        if (order.status === 'cancelled') return;
        const d = new Date(order.createdAt);
        if (isNaN(d.getTime())) return;

        // Calculate ISO week or simple 7-day block
        const dayOfWeek = d.getDay();
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - dayOfWeek);
        const key = `${startOfWeek.getFullYear()}-${startOfWeek.getMonth() + 1}-${startOfWeek.getDate()}`;
        const label = `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1}`;

        if (!weekMap[key]) {
          weekMap[key] = {
            label: `أسبوع ${label}`,
            revenue: 0,
            ordersCount: 0,
            timestamp: startOfWeek.getTime()
          };
        }

        weekMap[key].revenue += Number(order.totalPrice) || 0;
        weekMap[key].ordersCount += 1;
      });

      return Object.values(weekMap).sort((a, b) => a.timestamp - b.timestamp);
    }

    // Daily grouping
    // If timeframe is 7days or 14days or 30days, pre-fill continuous calendar days so the line is smooth
    const dayMap: Record<string, { dateKey: string; label: string; revenue: number; ordersCount: number; timestamp: number }> = {};
    
    // Determine span in days
    const daysCount = timeframe === '7days' ? 7 : timeframe === '14days' ? 14 : timeframe === '30days' ? 30 : 0;
    
    if (daysCount > 0) {
      const today = new Date();
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${day}`;
        const label = `${d.getDate()} / ${d.getMonth() + 1}`;
        dayMap[key] = {
          dateKey: key,
          label,
          revenue: 0,
          ordersCount: 0,
          timestamp: d.getTime()
        };
      }
    }

    filteredOrders.forEach(order => {
      if (order.status === 'cancelled') return;
      const d = new Date(order.createdAt);
      if (isNaN(d.getTime())) return;
      
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      const label = `${d.getDate()} / ${d.getMonth() + 1}`;

      if (!dayMap[key]) {
        dayMap[key] = {
          dateKey: key,
          label,
          revenue: 0,
          ordersCount: 0,
          timestamp: d.getTime()
        };
      }

      dayMap[key].revenue += Number(order.totalPrice) || 0;
      dayMap[key].ordersCount += 1;
    });

    return Object.values(dayMap).sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredOrders, orders.length, revenueInterval, timeframe]);

  // --------------------------------------------------------------------------
  // 4. ORDERS OVER TIME (Volume of orders per day)
  // --------------------------------------------------------------------------
  const ordersVolumeData = useMemo(() => {
    if (orders.length === 0) return [];

    const dayMap: Record<string, { dateKey: string; label: string; orders: number; delivered: number; timestamp: number }> = {};
    const daysCount = timeframe === '7days' ? 7 : timeframe === '14days' ? 14 : 30;

    // Pre-populate days for a complete bar sequence
    const today = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      dayMap[key] = {
        dateKey: key,
        label,
        orders: 0,
        delivered: 0,
        timestamp: d.getTime()
      };
    }

    filteredOrders.forEach(order => {
      const d = new Date(order.createdAt);
      if (isNaN(d.getTime())) return;

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      const label = `${d.getDate()}/${d.getMonth() + 1}`;

      if (!dayMap[key]) {
        dayMap[key] = {
          dateKey: key,
          label,
          orders: 0,
          delivered: 0,
          timestamp: d.getTime()
        };
      }

      dayMap[key].orders += 1;
      if (order.status === 'delivered') {
        dayMap[key].delivered += 1;
      }
    });

    return Object.values(dayMap).sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredOrders, orders.length, timeframe]);

  // --------------------------------------------------------------------------
  // 5. TOP CITIES PIE CHART (Cities with the most successful orders)
  // --------------------------------------------------------------------------
  const topCitiesData = useMemo(() => {
    // Only count successful orders (not cancelled)
    const validOrders = orders.filter(o => o.status !== 'cancelled' && o.city && o.city.trim());
    
    if (validOrders.length === 0) return [];

    const cityStats: Record<string, { name: string; count: number; totalSales: number }> = {};

    validOrders.forEach(order => {
      const rawCity = order.city.trim();
      const city = rawCity.charAt(0).toUpperCase() + rawCity.slice(1);

      if (!cityStats[city]) {
        cityStats[city] = {
          name: city,
          count: 0,
          totalSales: 0
        };
      }

      cityStats[city].count += 1;
      cityStats[city].totalSales += Number(order.totalPrice) || 0;
    });

    const sorted = Object.values(cityStats).sort((a, b) => b.count - a.count);

    // Take top 5 cities, group the rest as "مدن أخرى" (Other Cities)
    if (sorted.length <= 6) {
      return sorted;
    }

    const top5 = sorted.slice(0, 5);
    const others = sorted.slice(5);
    const othersCount = others.reduce((acc, curr) => acc + curr.count, 0);
    const othersSales = others.reduce((acc, curr) => acc + curr.totalSales, 0);

    return [
      ...top5,
      {
        name: 'مدن مغربية أخرى',
        count: othersCount,
        totalSales: othersSales
      }
    ];
  }, [orders]);

  const totalSuccessfulInCities = useMemo(() => {
    return topCitiesData.reduce((acc, c) => acc + c.count, 0);
  }, [topCitiesData]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP SUMMARY CARDS                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">إجمالي الإيرادات (Total Revenue)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            {metrics.totalRevenue.toLocaleString('fr-FR')}{' '}
            <span className="text-sm font-bold text-emerald-600">DH</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>مجموع المبيعات للطلبات النشطة والمكتملة</span>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-80" />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">إجمالي الطلبات (Total Orders)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            {metrics.totalOrders}{' '}
            <span className="text-sm font-semibold text-slate-500">طلبية</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>منها {metrics.successfulCount} طلبية ناجحة</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              {metrics.successRate}% نجاح
            </span>
          </div>
        </div>

        {/* Card 3: Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400 opacity-80" />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">متوسط قيمة السلة (Average Order Value)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            {metrics.averageOrderValue.toLocaleString('fr-FR')}{' '}
            <span className="text-sm font-bold text-amber-600">DH</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>متوسط إنفاق الزبون في الطلبية الواحدة</span>
          </div>
        </div>

        {/* Card 4: Operational Health */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-80" />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">حالة التوصيل والجاهزية</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-purple-700 tabular-nums">
            {metrics.deliveredCount + metrics.shippedCount}{' '}
            <span className="text-sm font-semibold text-slate-500">مشحون/مسلّم</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{metrics.newCount} طلب جديد ينتظر التأكيد</span>
            <span className="text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded">COD 🇲🇦</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. FILTER & TIMEFRAME TOOLBAR                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">نطاق التحليل الزمني:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTimeframe('7days')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === '7days' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => setTimeframe('14days')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === '14days' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              آخر 14 يوم
            </button>
            <button
              onClick={() => setTimeframe('30days')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === '30days' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              آخر 30 يوم
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === 'all' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              كل الوقت
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-emerald-50/70 border border-emerald-200/60 px-3 py-1 rounded-xl">
          <Info className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-emerald-800 font-medium">
            تجميع البيانات فوري ومحسوب محلياً (Zero Firebase writes/reads)
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. CHARTS GRID (RECHARTS)                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ---------------------------------------------------------------- */}
        {/* CHART 1: REVENUE OVER TIME (Line Chart)                          */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-12 xl:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  تطور الإيرادات (Revenue Over Time)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                مجموع المداخيل بالدرهم المغربي (DH) حسب تاريخ تسجيل الطلبات
              </p>
            </div>

            {/* Toggle Daily / Weekly */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs self-start sm:self-auto">
              <button
                onClick={() => setRevenueInterval('daily')}
                className={`px-2.5 py-1 rounded-md transition-colors font-semibold cursor-pointer ${
                  revenueInterval === 'daily'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                يومي (Daily)
              </button>
              <button
                onClick={() => setRevenueInterval('weekly')}
                className={`px-2.5 py-1 rounded-md transition-colors font-semibold cursor-pointer ${
                  revenueInterval === 'weekly'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                أسبوعي (Weekly)
              </button>
            </div>
          </div>

          {revenueChartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
              <span>لا توجد بيانات مبيعات في هذا النطاق الزمني</span>
            </div>
          ) : (
            <div className="h-72 w-full pt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(val) => `${val} DH`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                    formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} DH`, 'الإيرادات']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                    name="الإيرادات"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* CHART 2: ORDERS OVER TIME (Bar Chart)                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-12 xl:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900">
                حجم الطلبات يومياً (Orders Volume)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              عدد الطلبات المسجلة يومياً عبر جميع صفحات الهبوط
            </p>
          </div>

          {ordersVolumeData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
              <span>لا توجد طلبات مسجلة في هذا النطاق الزمني</span>
            </div>
          ) : (
            <div className="h-72 w-full pt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersVolumeData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                    formatter={(value: any) => [`${value} طلبية`, 'عدد الطلبات']}
                  />
                  <Bar 
                    dataKey="orders" 
                    fill="#3b82f6" 
                    radius={[6, 6, 0, 0]} 
                    name="الطلبات الواردة"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* CHART 3: TOP CITIES (Pie Chart & Regional Breakdown)              */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-12 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  أفضل المدن حسب الطلبات الناجحة (Top Cities)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                توزيع جغرافي للطلبات غير الملغاة بالمغرب مع نسبة كل مدينة والمبيعات
              </p>
            </div>

            <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
              إجمالي الطلبات بالمدن: <span className="font-bold text-emerald-700">{totalSuccessfulInCities}</span>
            </div>
          </div>

          {topCitiesData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <MapPin className="w-8 h-8 text-slate-300 mb-2" />
              <span>لا توجد طلبات كافية بعد لتحديد المدن الأكثر طلباً</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Pie Chart Display */}
              <div className="lg:col-span-5 h-72 w-full flex items-center justify-center" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topCitiesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="name"
                    >
                      {topCitiesData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CITY_COLORS[index % CITY_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
                      }}
                      formatter={(value: any, name: any, item: any) => {
                        const count = Number(value);
                        const pct = totalSuccessfulInCities > 0 
                          ? Math.round((count / totalSuccessfulInCities) * 100) 
                          : 0;
                        const sales = item.payload.totalSales;
                        return [
                          `${count} طلبية (${pct}%) · ${sales.toLocaleString('fr-FR')} DH`,
                          name
                        ];
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => <span className="text-xs text-slate-700 font-medium px-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* City Breakdown Ranking Table */}
              <div className="lg:col-span-7 space-y-3">
                <div className="text-xs font-bold text-slate-700 flex justify-between pb-1 border-b border-slate-100">
                  <span>المدينة</span>
                  <div className="flex gap-8">
                    <span>عدد الطلبات</span>
                    <span>المبيعات الصافية</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {topCitiesData.map((item, idx) => {
                    const percentage = totalSuccessfulInCities > 0
                      ? Math.round((item.count / totalSuccessfulInCities) * 100)
                      : 0;
                    const color = CITY_COLORS[idx % CITY_COLORS.length];

                    return (
                      <div key={item.name} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-3 h-3 rounded-full shrink-0" 
                              style={{ backgroundColor: color }} 
                            />
                            <span className="font-bold text-slate-900">{item.name}</span>
                            <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {percentage}%
                            </span>
                          </div>

                          <div className="flex items-center gap-8 font-mono text-xs">
                            <span className="font-bold text-slate-800">{item.count} طلب</span>
                            <span className="font-bold text-emerald-700 w-20 text-left">
                              {item.totalSales.toLocaleString('fr-FR')} DH
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: color 
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

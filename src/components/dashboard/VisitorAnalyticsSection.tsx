import React, { useState, useEffect, useMemo } from 'react';
import { VisitorSession } from '../../types';
import { 
  fetchAnalyticsSessions, 
  getRecentVisitors, 
  computeReferrerBreakdown, 
  computeDeviceBreakdown, 
  computeCountryBreakdown,
  getCountryFlag
} from '../../lib/visitorTracking';
import { 
  Users, Smartphone, Monitor, Globe, Share2, 
  Clock, ShieldCheck, RefreshCw, Radio, 
  TrendingUp, Laptop, ExternalLink, ArrowRight,
  Sparkles, CheckCircle2
} from 'lucide-react';

interface VisitorAnalyticsSectionProps {
  onViewProductSlug?: (slug: string) => void;
}

export const VisitorAnalyticsSection: React.FC<VisitorAnalyticsSectionProps> = ({
  onViewProductSlug
}) => {
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>('7days');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // Update current time every 30 seconds to recalculate "last 15 minutes" without database queries
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const loadAnalytics = async (days: number = 7) => {
    setIsLoading(true);
    try {
      const data = await fetchAnalyticsSessions(days);
      setSessions(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.warn('Failed to fetch analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const days = timeRange === 'today' ? 1 : (timeRange === '7days' ? 7 : 30);
    loadAnalytics(days);

    // Listen for locally recorded visitors in real time
    const handleLocalVisit = (e: any) => {
      const newSession = e.detail as VisitorSession;
      if (newSession) {
        setSessions(prev => [newSession, ...prev.filter(s => s.id !== newSession.id)]);
      }
    };

    window.addEventListener('allio_visitor_recorded', handleLocalVisit);
    return () => window.removeEventListener('allio_visitor_recorded', handleLocalVisit);
  }, [timeRange]);

  // 1. Filtered sessions based on timeframe
  const activeSessions = useMemo(() => {
    if (timeRange === 'today') {
      const todayDate = new Date().toISOString().split('T')[0];
      return sessions.filter(s => s.timestamp.startsWith(todayDate));
    }
    return sessions;
  }, [sessions, timeRange]);

  // 2. Recent Visitors (Last 15 minutes - simulated real-time, 0 database writes/reads)
  const recentVisitors = useMemo(() => {
    const fifteenMinsAgo = nowTimestamp - (15 * 60 * 1000);
    return activeSessions.filter(s => {
      const t = new Date(s.timestamp).getTime();
      return !isNaN(t) && t >= fifteenMinsAgo;
    });
  }, [activeSessions, nowTimestamp]);

  // 3. Granular Breakdowns
  const referrerBreakdown = useMemo(() => computeReferrerBreakdown(activeSessions), [activeSessions]);
  const deviceBreakdown = useMemo(() => computeDeviceBreakdown(activeSessions), [activeSessions]);
  const countryBreakdown = useMemo(() => computeCountryBreakdown(activeSessions), [activeSessions]);

  const formatRelativeTime = (timestamp: string): string => {
    const diffSec = Math.max(0, Math.floor((nowTimestamp - new Date(timestamp).getTime()) / 1000));
    if (diffSec < 60) return 'الآن';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin === 1) return 'منذ دقيقة واحدة';
    if (diffMin === 2) return 'منذ دقيقتين';
    if (diffMin < 11) return `منذ ${diffMin} دقائق`;
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours === 1) return 'منذ ساعة واحدة';
    if (diffHours < 24) return `منذ ${diffHours} ساعات`;
    return new Date(timestamp).toLocaleDateString('ar-MA');
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Zero-Heartbeat Architectural Guarantee Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 border border-emerald-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-sm">
                <Radio className="w-3.5 h-3.5 animate-pulse text-slate-950" />
                <span>نظام التتبع الدقيق للجلسات</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero-Heartbeat Policy: 100% حماية الحصة المجانية لـ Firebase</span>
              </span>
            </div>

            <h2 className="text-xl font-black text-white tracking-tight">
              تحليلات الزوار وحركة المرور المتقدمة (Granular Visitor Analytics)
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              تسجيل بيانات الجلسة (نوع الجهاز، نظام التشغيل، مصدر الزيارة، والدولة) <strong>مرة واحدة فقط لكل جلسة زائر</strong> وتجميعها يومياً لتفادي استنزاف قاعدة البيانات تماماً.
            </p>
          </div>

          {/* Timeframe & Manual Sync Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-800/80 p-1 rounded-2xl border border-slate-700 flex items-center gap-1 text-xs">
              <button
                onClick={() => setTimeRange('today')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  timeRange === 'today'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                اليوم
              </button>
              <button
                onClick={() => setTimeRange('7days')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  timeRange === '7days'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                آخر 7 أيام
              </button>
              <button
                onClick={() => setTimeRange('30days')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  timeRange === '30days'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                آخر 30 يوماً
              </button>
            </div>

            <button
              onClick={() => loadAnalytics(timeRange === 'today' ? 1 : (timeRange === '7days' ? 7 : 30))}
              disabled={isLoading}
              title="تحديث البيانات السحابية"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Recent Visitors (Last 15 minutes) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">زوار نشطون مؤخراً</span>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{recentVisitors.length}</span>
            <span className="text-xs font-bold text-emerald-600">في آخر 15 دقيقة</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">محاكاة فورية بدون استهلاك إضافي للـ DB</p>
        </div>

        {/* KPI 2: Total Sessions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي جلسات الزوار</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{activeSessions.length}</span>
            <span className="text-xs font-bold text-slate-500">جلسة مسجلة</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {timeRange === 'today' ? 'زيارات اليوم' : `زيارات ${timeRange === '7days' ? 'آخر 7 أيام' : 'آخر 30 يوماً'}`}
          </p>
        </div>

        {/* KPI 3: Mobile Share */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">حصة الهواتف الذكية</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{deviceBreakdown.mobilePercent}%</span>
            <span className="text-xs font-bold text-slate-500">({deviceBreakdown.mobileCount} زائر)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            مقارنة بـ {deviceBreakdown.desktopPercent}% للحواسيب
          </p>
        </div>

        {/* KPI 4: Top Traffic Source */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">أقوى مصدر زيارات</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 truncate">
              {referrerBreakdown[0]?.name || 'مباشر (Direct)'}
            </span>
            <span className="text-xs font-bold text-purple-600">
              {referrerBreakdown[0]?.percentage || 100}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {referrerBreakdown[0]?.count || 0} زيارة مسجلة
          </p>
        </div>
      </div>

      {/* Main Granular Grid: 4 Core Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Recent Visitors Stream (Last 15 minutes) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">
                  الزوار النشطون مؤخراً (Recent Visitors)
                </h3>
                <p className="text-[11px] text-slate-500">
                  تصفية فورية حسب التوقيت الزمني (آخر 15 دقيقة) بدون تكلفة استعلام
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              {recentVisitors.length} زائر نشط
            </span>
          </div>

          {recentVisitors.length === 0 ? (
            <div className="text-center py-10 space-y-2 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">لا يوجد زوار نشطون في آخر 15 دقيقة</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                عندما يزور عميل صفحة الهبوط أو المتجر، ستظهر بيانات جهازه ومصدره هنا مباشرة.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {recentVisitors.slice(0, 15).map((v) => (
                <div
                  key={v.id}
                  className="bg-slate-50 hover:bg-slate-100/80 transition-colors p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Device Icon */}
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      {v.deviceType === 'mobile' ? (
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Monitor className="w-4 h-4 text-blue-600" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 truncate">
                          {v.os} • {v.browser}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {v.deviceType === 'mobile' ? 'هاتف' : 'حاسوب'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <span>{getCountryFlag(v.countryCode)}</span>
                          <span>{v.city ? `${v.city}، ` : ''}{v.country}</span>
                        </span>
                        <span>•</span>
                        <span className="font-medium text-emerald-700 truncate" dir="ltr">
                          {v.path}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span 
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-2xs"
                      style={{
                        backgroundColor: 
                          v.referrer.includes('TikTok') ? '#000000' :
                          v.referrer.includes('Facebook') ? '#1877F2' :
                          v.referrer.includes('Instagram') ? '#E1306C' :
                          v.referrer.includes('Google') ? '#EA4335' :
                          v.referrer.includes('Direct') ? '#059669' : '#475569'
                      }}
                    >
                      {v.referrer}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatRelativeTime(v.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Traffic Sources (Referrers) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">
                  مصادر الزيارات (Traffic Sources)
                </h3>
                <p className="text-[11px] text-slate-500">
                  تحديد المنصات الإعلانية ومواقع الإحالة المسؤولة عن جلب الزوار
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {referrerBreakdown.length} مصادر
            </span>
          </div>

          {referrerBreakdown.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              لا توجد بيانات حركة مرور مسجلة لهذه الفترة
            </div>
          ) : (
            <div className="space-y-3.5">
              {referrerBreakdown.map((r) => (
                <div key={r.name} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: r.color }}
                      />
                      <span className="font-bold text-slate-800">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">{r.count} زيارة</span>
                      <span className="text-slate-400 text-[11px]">({r.percentage}%)</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(4, r.percentage)}%`,
                        backgroundColor: r.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Device & OS Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">
                  توزيع الأجهزة والأنظمة (Device & OS)
                </h3>
                <p className="text-[11px] text-slate-500">
                  مقارنة الهواتف الذكية مقابل الحواسيب وأنظمة التشغيل
                </p>
              </div>
            </div>
          </div>

          {/* Visual Device Distribution Bar */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <Smartphone className="w-4 h-4" />
                <span>الهاتف المحمول ({deviceBreakdown.mobilePercent}%)</span>
              </span>
              <span className="flex items-center gap-1.5 text-blue-700">
                <Monitor className="w-4 h-4" />
                <span>الحاسوب ({deviceBreakdown.desktopPercent}%)</span>
              </span>
            </div>

            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                className="bg-emerald-500 h-full transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${deviceBreakdown.mobilePercent || 85}%` }}
                title={`الهواتف: ${deviceBreakdown.mobileCount}`}
              >
                {deviceBreakdown.mobilePercent > 15 ? `${deviceBreakdown.mobilePercent}%` : ''}
              </div>
              <div
                className="bg-blue-600 h-full transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${deviceBreakdown.desktopPercent || 15}%` }}
                title={`الحواسيب: ${deviceBreakdown.desktopCount}`}
              >
                {deviceBreakdown.desktopPercent > 15 ? `${deviceBreakdown.desktopPercent}%` : ''}
              </div>
            </div>

            {/* Operating Systems Pills */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block">أنظمة التشغيل المكتشفة:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {deviceBreakdown.osBreakdown.map((item) => (
                  <div
                    key={item.os}
                    className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center space-y-0.5"
                  >
                    <span className="text-xs font-bold text-slate-800 block">{item.os}</span>
                    <span className="text-[11px] font-black text-emerald-700 block">
                      {item.percentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">({item.count} زيارة)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Country Distribution List */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">
                  التوزيع الجغرافي (Country Breakdown)
                </h3>
                <p className="text-[11px] text-slate-500">
                  تحديد بلدان الزوار من خلال فحص عنوان IP الخفيف
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {countryBreakdown.length} دول
            </span>
          </div>

          {countryBreakdown.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              لا توجد بيانات جغرافية مسجلة لهذه الفترة
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {countryBreakdown.map((c) => (
                <div
                  key={c.countryCode}
                  className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl shrink-0">{c.flag}</span>
                    <div>
                      <span className="font-bold text-slate-900 block">{c.country}</span>
                      <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{c.countryCode}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <span className="font-black text-slate-900 block">{c.count} زيارة</span>
                      <span className="text-[11px] text-emerald-700 font-bold block">{c.percentage}%</span>
                    </div>

                    <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden shrink-0 hidden sm:block">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${Math.max(8, c.percentage)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

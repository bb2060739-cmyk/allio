import { doc, setDoc, getDoc, arrayUnion, increment, collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { VisitorSession, VisitorDeviceType, VisitorOS } from '../types';

const SESSION_STORAGE_FLAG = 'allio_session_recorded';
const GEO_CACHE_KEY = 'allio_visitor_geo';
const LOCAL_SESSIONS_CACHE_KEY = 'allio_local_visitor_sessions';

/**
 * Parses user-agent string into device category and operating system
 */
export function detectDeviceAndOS(): { deviceType: VisitorDeviceType; os: VisitorOS; browser: string } {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { deviceType: 'desktop', os: 'Other', browser: 'Unknown' };
  }

  const ua = navigator.userAgent || '';
  
  // 1. Device Type
  let deviceType: VisitorDeviceType = 'desktop';
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = 'mobile';
  }

  // 2. Operating System
  let os: VisitorOS = 'Other';
  if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/windows nt/i.test(ua)) {
    os = 'Windows';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'Mac';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // 3. Browser
  let browser = 'Other';
  if (/tiktok/i.test(ua)) {
    browser = 'TikTok Browser';
  } else if (/fbav|fban|instagram/i.test(ua)) {
    browser = 'Meta In-App';
  } else if (/edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/opr|opera/i.test(ua)) {
    browser = 'Opera';
  }

  return { deviceType, os, browser };
}

/**
 * Categorizes document.referrer into clean, human-readable traffic sources
 */
export function categorizeReferrer(referrerUrl?: string): string {
  if (!referrerUrl || typeof referrerUrl !== 'string' || referrerUrl.trim() === '') {
    return 'مباشر (Direct)';
  }

  const lower = referrerUrl.toLowerCase();

  // Internal referrers from current domain
  if (typeof window !== 'undefined' && referrerUrl.includes(window.location.host)) {
    return 'مباشر (Direct)';
  }

  if (lower.includes('facebook.com') || lower.includes('fb.com') || lower.includes('fb.me')) {
    return 'Facebook';
  }
  if (lower.includes('tiktok.com')) {
    return 'TikTok';
  }
  if (lower.includes('instagram.com')) {
    return 'Instagram';
  }
  if (lower.includes('google.')) {
    return 'Google';
  }
  if (lower.includes('snapchat.com')) {
    return 'Snapchat';
  }
  if (lower.includes('whatsapp') || lower.includes('wa.me')) {
    return 'WhatsApp';
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return 'YouTube';
  }
  if (lower.includes('t.co') || lower.includes('twitter.com') || lower.includes('x.com')) {
    return 'X (Twitter)';
  }
  if (lower.includes('pinterest.')) {
    return 'Pinterest';
  }

  try {
    const parsed = new URL(referrerUrl);
    return parsed.hostname.replace('www.', '');
  } catch {
    return 'مواقع أخرى (Referral)';
  }
}

/**
 * Fetches the visitor's country with session-level caching & safe fallbacks
 */
export async function detectCountry(): Promise<{ country: string; countryCode: string; city?: string }> {
  const fallback = { country: 'المغرب', countryCode: 'MA', city: 'الدار البيضاء' };

  if (typeof window === 'undefined') return fallback;

  // 1. Session Storage Cache check to avoid redundant API requests
  try {
    const cached = sessionStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // ignore
  }

  // 2. Quick lightweight IP API with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2200);

    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const countryName = data.country_name || (data.country_code === 'MA' ? 'المغرب' : data.country_code);
      const res = {
        country: countryName || 'المغرب',
        countryCode: data.country_code || 'MA',
        city: data.city || 'الدار البيضاء'
      };
      try {
        sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(res));
      } catch {
        // ignore
      }
      return res;
    }
  } catch {
    // Secondary fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const res2 = await fetch('https://api.country.is/', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res2.ok) {
        const d2 = await res2.json();
        const code = d2.country || 'MA';
        const res = {
          country: code === 'MA' ? 'المغرب' : code,
          countryCode: code,
          city: code === 'MA' ? 'الدار البيضاء' : ''
        };
        sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(res));
        return res;
      }
    } catch {
      // ignore
    }
  }

  return fallback;
}

/**
 * Get today's date formatted as YYYY-MM-DD
 */
export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Record a visitor session EXACTLY ONCE per user session (ZERO-HEARTBEAT POLICY).
 * Saves to Firestore daily aggregated document at `analytics/YYYY-MM-DD`.
 */
export async function recordVisitorSession(pageInfo: {
  path?: string;
  storeId?: string;
  pageTitle?: string;
}): Promise<VisitorSession | null> {
  if (typeof window === 'undefined') return null;

  // 1. STRICT ZERO-HEARTBEAT GUARANTEE: Check sessionStorage
  try {
    if (sessionStorage.getItem(SESSION_STORAGE_FLAG) === 'true') {
      return null; // Already recorded for this session. Zero extra writes!
    }
    // Set flag immediately to avoid race conditions
    sessionStorage.setItem(SESSION_STORAGE_FLAG, 'true');
  } catch {
    // If storage is disabled, proceed defensively
  }

  // 2. Extract Device, OS, Browser
  const { deviceType, os, browser } = detectDeviceAndOS();

  // 3. Extract Referrer
  const rawReferrer = document.referrer || '';
  const categorizedReferrer = categorizeReferrer(rawReferrer);

  // 4. Extract Country / Location
  const geo = await detectCountry();

  // 5. Build Session Object
  const nowISO = new Date().toISOString();
  const sessionId = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

  const session: VisitorSession = {
    id: sessionId,
    timestamp: nowISO,
    deviceType,
    os,
    browser,
    referrer: categorizedReferrer,
    referrerUrl: rawReferrer ? rawReferrer.substring(0, 160) : undefined,
    country: geo.country,
    countryCode: geo.countryCode,
    city: geo.city,
    path: pageInfo.path || window.location.pathname || '/',
    storeId: pageInfo.storeId || 'store-default',
    pageTitle: pageInfo.pageTitle || document.title || 'صفحة هبوط'
  };

  // 6. Local optimistic cache update (bounded to last 150 sessions)
  try {
    const rawLocal = localStorage.getItem(LOCAL_SESSIONS_CACHE_KEY);
    const localList: VisitorSession[] = rawLocal ? JSON.parse(rawLocal) : [];
    localList.unshift(session);
    if (localList.length > 150) localList.length = 150;
    localStorage.setItem(LOCAL_SESSIONS_CACHE_KEY, JSON.stringify(localList));
    window.dispatchEvent(new CustomEvent('allio_visitor_recorded', { detail: session }));
  } catch {
    // ignore
  }

  // 7. Write to Firestore in daily aggregated document `analytics/YYYY-MM-DD`
  // Writes EXACTLY ONCE per visit to preserve the Firebase Free Tier!
  try {
    const dateKey = getTodayDateKey();
    const docRef = doc(db, 'analytics', dateKey);

    await setDoc(docRef, {
      date: dateKey,
      totalVisits: increment(1),
      sessions: arrayUnion(session),
      lastUpdated: nowISO
    }, { merge: true });

    console.log(`[Zero-Heartbeat Analytics] Visit recorded to analytics/${dateKey}`, {
      device: deviceType,
      os,
      referrer: categorizedReferrer,
      country: geo.country
    });
  } catch (err) {
    console.warn('[Zero-Heartbeat Analytics] Notice on saving session to Firestore:', err);
  }

  return session;
}

/**
 * Fetches analytics visitor sessions for the last N days without heartbeat overhead.
 * Performs a small, bounded read (only up to N documents).
 */
export async function fetchAnalyticsSessions(daysCount: number = 7): Promise<VisitorSession[]> {
  const sessionsMap = new Map<string, VisitorSession>();

  // 1. First load local cached sessions
  try {
    const raw = localStorage.getItem(LOCAL_SESSIONS_CACHE_KEY);
    if (raw) {
      const parsed: VisitorSession[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(s => sessionsMap.set(s.id, s));
      }
    }
  } catch {
    // ignore
  }

  // 2. Fetch daily aggregated documents from Firestore for the past `daysCount` days
  try {
    const datesToFetch: string[] = [];
    const now = new Date();
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      datesToFetch.push(`${y}-${m}-${day}`);
    }

    // Fetch individual day docs in parallel
    const docPromises = datesToFetch.map(dateKey => getDoc(doc(db, 'analytics', dateKey)));
    const snapshots = await Promise.all(docPromises);

    snapshots.forEach(snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.sessions)) {
          data.sessions.forEach((s: VisitorSession) => {
            if (s && s.id) {
              sessionsMap.set(s.id, s);
            }
          });
        }
      }
    });
  } catch (err) {
    console.warn('[Analytics] Notice on fetching cloud analytics docs:', err);
  }

  const allSessions = Array.from(sessionsMap.values());
  allSessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return allSessions;
}

/**
 * Filter sessions active in the last `minutes` (simulated real-time with ZERO database queries)
 */
export function getRecentVisitors(sessions: VisitorSession[], minutes: number = 15): VisitorSession[] {
  const threshold = Date.now() - (minutes * 60 * 1000);
  return sessions.filter(s => {
    const t = new Date(s.timestamp).getTime();
    return !isNaN(t) && t >= threshold;
  });
}

/**
 * Get country flag emoji from 2-letter country code
 */
export function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const code = countryCode.toUpperCase();
  if (code === 'MA') return '🇲🇦';
  if (code === 'FR') return '🇫🇷';
  if (code === 'ES') return '🇪🇸';
  if (code === 'US') return '🇺🇸';
  if (code === 'DE') return '🇩🇪';
  if (code === 'GB' || code === 'UK') return '🇬🇧';
  if (code === 'IT') return '🇮🇹';
  if (code === 'DZ') return '🇩🇿';
  if (code === 'TN') return '🇹🇳';
  if (code === 'AE') return '🇦🇪';
  if (code === 'SA') return '🇸🇦';
  if (code === 'NL') return '🇳🇱';
  if (code === 'BE') return '🇧🇪';
  if (code === 'CA') return '🇨🇦';

  // Universal ISO flag converter
  const offset = 127397;
  const chars = [...code].map(c => c.charCodeAt(0) + offset);
  return String.fromCodePoint(...chars);
}

/**
 * Computes referrers breakdown
 */
export function computeReferrerBreakdown(sessions: VisitorSession[]): {
  name: string;
  count: number;
  percentage: number;
  color: string;
}[] {
  if (sessions.length === 0) return [];
  const map: Record<string, number> = {};

  sessions.forEach(s => {
    const ref = s.referrer || 'مباشر (Direct)';
    map[ref] = (map[ref] || 0) + 1;
  });

  const colorPalette: Record<string, string> = {
    'Facebook': '#1877F2',
    'TikTok': '#000000',
    'Instagram': '#E1306C',
    'Google': '#EA4335',
    'Snapchat': '#FFFC00',
    'WhatsApp': '#25D366',
    'YouTube': '#FF0000',
    'X (Twitter)': '#1DA1F2',
    'مباشر (Direct)': '#10B981'
  };

  const total = sessions.length;
  return Object.entries(map)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
      color: colorPalette[name] || '#64748B'
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Computes device distribution (Mobile vs Desktop vs Tablet and OS)
 */
export function computeDeviceBreakdown(sessions: VisitorSession[]): {
  mobileCount: number;
  desktopCount: number;
  tabletCount: number;
  mobilePercent: number;
  desktopPercent: number;
  tabletPercent: number;
  osBreakdown: { os: VisitorOS; count: number; percentage: number }[];
} {
  const total = sessions.length;
  if (total === 0) {
    return {
      mobileCount: 0,
      desktopCount: 0,
      tabletCount: 0,
      mobilePercent: 0,
      desktopPercent: 0,
      tabletPercent: 0,
      osBreakdown: []
    };
  }

  let mobileCount = 0;
  let desktopCount = 0;
  let tabletCount = 0;
  const osMap: Record<VisitorOS, number> = {
    'iOS': 0,
    'Android': 0,
    'Windows': 0,
    'Mac': 0,
    'Linux': 0,
    'Other': 0
  };

  sessions.forEach(s => {
    if (s.deviceType === 'mobile') mobileCount++;
    else if (s.deviceType === 'tablet') tabletCount++;
    else desktopCount++;

    const osKey = s.os || 'Other';
    osMap[osKey] = (osMap[osKey] || 0) + 1;
  });

  const osBreakdown = (Object.keys(osMap) as VisitorOS[])
    .map(os => ({
      os,
      count: osMap[os],
      percentage: Math.round((osMap[os] / total) * 100)
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    mobileCount,
    desktopCount,
    tabletCount,
    mobilePercent: Math.round((mobileCount / total) * 100),
    desktopPercent: Math.round((desktopCount / total) * 100),
    tabletPercent: Math.round((tabletCount / total) * 100),
    osBreakdown
  };
}

/**
 * Computes country distribution
 */
export function computeCountryBreakdown(sessions: VisitorSession[]): {
  country: string;
  countryCode: string;
  count: number;
  percentage: number;
  flag: string;
}[] {
  if (sessions.length === 0) return [];
  const map: Record<string, { country: string; countryCode: string; count: number }> = {};

  sessions.forEach(s => {
    const key = s.countryCode || s.country || 'MA';
    if (!map[key]) {
      map[key] = {
        country: s.country || 'المغرب',
        countryCode: s.countryCode || 'MA',
        count: 0
      };
    }
    map[key].count++;
  });

  const total = sessions.length;
  return Object.values(map)
    .map(c => ({
      country: c.country,
      countryCode: c.countryCode,
      count: c.count,
      percentage: Math.round((c.count / total) * 100),
      flag: getCountryFlag(c.countryCode)
    }))
    .sort((a, b) => b.count - a.count);
}

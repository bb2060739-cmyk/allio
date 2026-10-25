import { PixelEventLog } from '../types';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    ttq?: {
      track: (eventName: string, params?: Record<string, unknown>) => void;
      page: () => void;
      load: (pixelId: string) => void;
      [key: string]: unknown;
    };
  }
}

const PIXEL_EVENTS_KEY = 'allio_pixel_event_logs';

export const getStoredPixelEvents = (): PixelEventLog[] => {
  try {
    const raw = localStorage.getItem(PIXEL_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const savePixelEventLog = (log: PixelEventLog) => {
  try {
    const existing = getStoredPixelEvents();
    const updated = [log, ...existing].slice(0, 50); // keep last 50 events
    localStorage.setItem(PIXEL_EVENTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('allio_pixel_event', { detail: log }));
  } catch (err) {
    console.error('Failed to save pixel log', err);
  }
};

export const initTrackingPixels = (fbPixelId?: string, tiktokPixelId?: string) => {
  // Initialize Facebook Pixel if configured
  if (fbPixelId && typeof window !== 'undefined') {
    if (!window.fbq) {
      /* eslint-disable */
      // Standard Facebook Pixel snippet emulation & injection
      const fbScript = document.createElement('script');
      fbScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
      `;
      document.head.appendChild(fbScript);
    }
    try {
      if (window.fbq) {
        window.fbq('init', fbPixelId);
        window.fbq('track', 'PageView');
        savePixelEventLog({
          id: 'log-' + Date.now() + '-fb-init',
          timestamp: new Date().toISOString(),
          platform: 'facebook',
          pixelId: fbPixelId,
          eventName: 'PageView',
          data: { action: 'init_pageview' }
        });
      }
    } catch (e) {
      console.warn('FB Pixel init notice:', e);
    }
  }

  // Initialize TikTok Pixel if configured
  if (tiktokPixelId && typeof window !== 'undefined') {
    if (!window.ttq) {
      const ttScript = document.createElement('script');
      ttScript.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        }(window, document, 'ttq');
      `;
      document.head.appendChild(ttScript);
    }
    try {
      if (window.ttq) {
        window.ttq.load(tiktokPixelId);
        window.ttq.page();
        savePixelEventLog({
          id: 'log-' + Date.now() + '-tt-init',
          timestamp: new Date().toISOString(),
          platform: 'tiktok',
          pixelId: tiktokPixelId,
          eventName: 'Page',
          data: { action: 'tiktok_page' }
        });
      }
    } catch (e) {
      console.warn('TikTok Pixel init notice:', e);
    }
  }
};

export const trackPixelEvent = (
  eventName: 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase',
  fbPixelId?: string,
  tiktokPixelId?: string,
  data?: {
    content_name?: string;
    content_ids?: string[];
    value?: number;
    currency?: string;
    num_items?: number;
    order_id?: string;
  }
) => {
  const payload = {
    ...data,
    currency: data?.currency || 'MAD',
  };

  // Facebook
  if (fbPixelId) {
    try {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', eventName, payload);
      }
      savePixelEventLog({
        id: 'log-' + Date.now() + '-fb-' + eventName,
        timestamp: new Date().toISOString(),
        platform: 'facebook',
        pixelId: fbPixelId,
        eventName,
        data: payload as Record<string, unknown>
      });
    } catch (e) {
      console.warn('Error tracking Facebook event:', e);
    }
  }

  // TikTok
  if (tiktokPixelId) {
    try {
      // Map standard event to TikTok event naming
      const ttEventMap: Record<string, string> = {
        ViewContent: 'ViewContent',
        AddToCart: 'AddToCart',
        InitiateCheckout: 'InitiateCheckout',
        Purchase: 'CompletePayment',
      };
      const ttEvent = ttEventMap[eventName] || eventName;

      if (typeof window !== 'undefined' && window.ttq) {
        window.ttq.track(ttEvent, payload);
      }
      savePixelEventLog({
        id: 'log-' + Date.now() + '-tt-' + ttEvent,
        timestamp: new Date().toISOString(),
        platform: 'tiktok',
        pixelId: tiktokPixelId,
        eventName: ttEvent,
        data: payload as Record<string, unknown>
      });
    } catch (e) {
      console.warn('Error tracking TikTok event:', e);
    }
  }
};

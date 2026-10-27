/**
 * Utility functions and React hook for dynamic browser tab favicon and title.
 * Zero Firebase read overhead - reuses in-memory store & product data.
 */
import { useEffect } from 'react';

/**
 * Adjust hex color brightness for subtle gradient/contrast effects
 */
function adjustBrightness(hex: string, percent: number): string {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return hex;
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
}

/**
 * Generates an SVG Data URI favicon with a rounded square and the brand's initial letter.
 * Used whenever a store has a text logo or hasn't uploaded a custom image favicon.
 */
export function generateSvgFavicon(primaryColor: string = '#059669', symbol: string = 'A'): string {
  const cleanSymbol = symbol.trim().charAt(0).toUpperCase() || 'A';
  const cleanColor = primaryColor.startsWith('#') ? primaryColor : '#059669';
  const darkColor = adjustBrightness(cleanColor, -22);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="fav-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${cleanColor}"/>
      <stop offset="100%" stop-color="${darkColor}"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#fav-grad)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="34">${cleanSymbol}</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

/**
 * Updates the browser's favicon links in the document head
 */
export function updateFavicon(iconUrl: string): void {
  if (typeof document === 'undefined') return;

  // Look for existing icon links or create one
  let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  // Set type appropriately
  if (iconUrl.startsWith('data:image/svg+xml')) {
    link.type = 'image/svg+xml';
  } else if (iconUrl.endsWith('.png') || iconUrl.startsWith('data:image/png')) {
    link.type = 'image/png';
  } else if (iconUrl.endsWith('.jpg') || iconUrl.endsWith('.jpeg') || iconUrl.startsWith('data:image/jpeg')) {
    link.type = 'image/jpeg';
  } else {
    link.type = 'image/x-icon';
  }

  link.href = iconUrl;

  // Also update or add apple-touch-icon
  let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
  if (!appleLink) {
    appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    document.head.appendChild(appleLink);
  }
  appleLink.href = iconUrl;
}

/**
 * Updates the document title safely
 */
export function updateDocumentTitle(title: string): void {
  if (typeof document === 'undefined') return;
  document.title = title.trim();
}

/**
 * React hook options for dynamic head synchronization
 */
export interface DynamicHeadOptions {
  title?: string;
  storeName?: string;
  logoImageUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
}

/**
 * React hook to synchronize document title & favicon dynamically with zero extra Firestore reads.
 */
export function useDynamicHead({
  title,
  storeName,
  logoImageUrl,
  faviconUrl,
  primaryColor
}: DynamicHeadOptions): void {
  useEffect(() => {
    // 1. Title Resolution
    const resolvedTitle = title?.trim() || storeName?.trim() || 'Allio';
    updateDocumentTitle(resolvedTitle);

    // 2. Favicon Resolution
    const customIcon = faviconUrl?.trim() || logoImageUrl?.trim();
    if (customIcon) {
      updateFavicon(customIcon);
    } else {
      const fallbackFavicon = generateSvgFavicon(
        primaryColor || '#059669',
        storeName || 'A'
      );
      updateFavicon(fallbackFavicon);
    }
  }, [title, storeName, logoImageUrl, faviconUrl, primaryColor]);
}

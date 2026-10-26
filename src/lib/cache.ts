/**
 * In-Memory Caching System for Admin Dashboard
 * Prevents unnecessary Firestore re-fetches and redundant computations when navigating between Admin tabs.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

// Default cache TTL: 5 minutes (300,000 ms)
export const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

/**
 * Retrieve data from cache if present and unexpired.
 */
export function getFromCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > entry.ttlMs) {
    // Expired
    memoryCache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Store data into in-memory cache with specified TTL.
 */
export function setInCache<T>(key: string, data: T, ttlMs: number = DEFAULT_CACHE_TTL): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttlMs
  });
}

/**
 * Invalidate a specific cache key or all cache entries.
 */
export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    memoryCache.clear();
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Helper to fetch with SWR (Stale-While-Revalidate) caching semantics.
 */
export function getCachedOrFetch<T>(
  key: string,
  fetcher: () => T,
  ttlMs: number = DEFAULT_CACHE_TTL
): T {
  const cached = getFromCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const fresh = fetcher();
  setInCache(key, fresh, ttlMs);
  return fresh;
}

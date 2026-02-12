/**
 * Local Cache Manager
 * Provides instant loading for previously visited pages
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Set cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl
    });

    // Also store in localStorage for persistence
    try {
      localStorage.setItem(
        `cache_${key}`,
        JSON.stringify({
          data,
          timestamp: Date.now(),
          expiresIn: ttl
        })
      );
    } catch (e) {
      console.warn('Failed to write to localStorage:', e);
    }
  }

  /**
   * Get cache entry if not expired
   */
  get<T>(key: string): T | null {
    // Try memory cache first
    let entry = this.cache.get(key);

    // If not in memory, try localStorage
    if (!entry) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          entry = JSON.parse(stored);
          if (entry) {
            this.cache.set(key, entry);
          }
        }
      } catch (e) {
        console.warn('Failed to read from localStorage:', e);
      }
    }

    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if expired
    if (age > entry.expiresIn) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if cache has valid entry
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (e) {
      console.warn('Failed to remove from localStorage:', e);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    return {
      total: entries.length,
      valid: entries.filter(([_, entry]) =>
        now - entry.timestamp < entry.expiresIn
      ).length,
      expired: entries.filter(([_, entry]) =>
        now - entry.timestamp >= entry.expiresIn
      ).length
    };
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

/**
 * React hook for cached data fetching
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first
      const cached = cacheManager.get<T>(key);
      if (cached) {
        setData(cached);
        setIsLoading(false);
        return;
      }

      // Fetch fresh data
      const freshData = await fetcher();
      cacheManager.set(key, freshData, ttl);
      setData(freshData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchData
  };
}

// Export for use in components
import React from 'react';
export default cacheManager;

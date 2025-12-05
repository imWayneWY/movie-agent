/**
 * Simple in-memory cache with TTL support
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Cache {
  private store: Map<string, CacheEntry<any>>;
  private defaultTtl: number;

  /**
   * Creates a new cache instance
   * @param defaultTtl Default time-to-live in seconds
   */
  constructor(defaultTtl: number = 3600) {
    this.store = new Map();
    this.defaultTtl = defaultTtl;
  }

  /**
   * Sets a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time-to-live in seconds (optional, uses default if not provided)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const effectiveTtl = ttl ?? this.defaultTtl;
    const expiresAt = Date.now() + effectiveTtl * 1000;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Gets a value from the cache
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Checks if a key exists and is not expired
   * @param key Cache key
   * @returns true if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Deletes a key from the cache
   * @param key Cache key
   * @returns true if key existed and was deleted
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clears all entries from the cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Gets the number of entries in the cache (including expired ones)
   * @returns Number of entries
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Removes all expired entries from the cache
   * @returns Number of entries removed
   */
  prune(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// Singleton instance for application-wide use
let cacheInstance: Cache | null = null;

/**
 * Gets the global cache instance
 * @param ttl Default TTL for the cache (only used on first call)
 * @returns Global cache instance
 */
export function getCache(ttl?: number): Cache {
  if (!cacheInstance) {
    cacheInstance = new Cache(ttl);
  }
  return cacheInstance;
}

/**
 * Resets the global cache instance (useful for testing)
 */
export function resetCache(): void {
  cacheInstance = null;
}

/**
 * Generates a cache key for discover parameters
 * @param params Discover parameters object
 * @returns Cache key string
 */
export function generateDiscoverCacheKey(params: Record<string, any>): string {
  // Sort keys to ensure consistent key generation
  const sortedKeys = Object.keys(params).sort();
  const keyParts = sortedKeys.map(key => `${key}=${params[key]}`);
  return `discover:${keyParts.join('&')}`;
}

/**
 * Generates a cache key for watch providers
 * @param movieId Movie ID
 * @param region Region code
 * @returns Cache key string
 */
export function generateProvidersCacheKey(movieId: number | string, region: string): string {
  return `providers:${movieId}:${region}`;
}

/**
 * Simple in-memory cache with TTL support
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Optional context for cache key isolation in multi-tenant scenarios.
 * Allows separating cache entries by user, session, or tenant.
 */
export interface CacheContext {
  /** User identifier for user-specific cache isolation */
  userId?: string;
  /** Session identifier for session-specific cache isolation */
  sessionId?: string;
  /** Tenant identifier for multi-tenant cache isolation */
  tenantId?: string;
}

/**
 * Sanitizes a context value to prevent cache key collisions.
 * Encodes special characters to ensure unique, safe cache keys.
 * Uses encodeURIComponent to handle special characters like colons, slashes, etc.
 * @param value Context value to sanitize
 * @returns Sanitized value safe for use in cache keys
 * @throws Error if value is empty
 */
function sanitizeContextValue(value: string): string {
  if (!value || value.trim() === '') {
    throw new Error('Context values cannot be empty strings');
  }
  // Use URI encoding to handle special characters safely
  // This prevents collisions from characters like ':', '/', ';', etc.
  return encodeURIComponent(value);
}

/**
 * Applies context prefix to a cache key for multi-tenant isolation.
 * Prefixes are applied in order: tenant -> user -> session
 * @param key Base cache key
 * @param context Optional context for isolation
 * @returns Prefixed cache key if context is provided, otherwise the original key
 */
function applyContextPrefix(key: string, context?: CacheContext): string {
  if (!context) {
    return key;
  }

  const prefixParts: string[] = [];
  if (context.tenantId) {
    prefixParts.push(`tenant:${sanitizeContextValue(context.tenantId)}`);
  }
  if (context.userId) {
    prefixParts.push(`user:${sanitizeContextValue(context.userId)}`);
  }
  if (context.sessionId) {
    prefixParts.push(`session:${sanitizeContextValue(context.sessionId)}`);
  }

  return prefixParts.length > 0 ? `${prefixParts.join(':')}:${key}` : key;
}

export class Cache {
  private store: Map<string, CacheEntry<any>>;
  private defaultTtl: number;
  private context?: CacheContext;

  /**
   * Creates a new cache instance
   * @param defaultTtl Default time-to-live in seconds
   * @param context Optional context for cache key isolation (e.g., userId, sessionId, tenantId)
   * @throws Error if any context value is an empty string
   */
  constructor(defaultTtl: number = 3600, context?: CacheContext) {
    this.store = new Map();
    this.defaultTtl = defaultTtl;

    // Validate context values if provided
    if (context) {
      if (
        context.tenantId !== undefined &&
        (!context.tenantId || context.tenantId.trim() === '')
      ) {
        throw new Error('Context values cannot be empty strings');
      }
      if (
        context.userId !== undefined &&
        (!context.userId || context.userId.trim() === '')
      ) {
        throw new Error('Context values cannot be empty strings');
      }
      if (
        context.sessionId !== undefined &&
        (!context.sessionId || context.sessionId.trim() === '')
      ) {
        throw new Error('Context values cannot be empty strings');
      }
    }

    this.context = context;
  }

  /**
   * Prefixes a cache key with context information for isolation.
   * @param key Base cache key
   * @returns Prefixed cache key with context
   */
  private prefixKey(key: string): string {
    return applyContextPrefix(key, this.context);
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
    const prefixedKey = this.prefixKey(key);
    this.store.set(prefixedKey, { value, expiresAt });
  }

  /**
   * Gets a value from the cache
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const prefixedKey = this.prefixKey(key);
    const entry = this.store.get(prefixedKey);

    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(prefixedKey);
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
    const prefixedKey = this.prefixKey(key);
    return this.store.delete(prefixedKey);
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
 * Gets the global cache instance.
 *
 * NOTE: The global cache instance does not support context-based isolation.
 * For multi-tenant scenarios requiring cache isolation, create separate Cache
 * instances with appropriate context parameters instead of using the global singleton.
 *
 * @example
 * // For single-tenant CLI usage (default):
 * const cache = getCache(3600);
 *
 * // For multi-tenant scenarios, use separate instances:
 * const tenantCache = new Cache(3600, { tenantId: 'tenant1' });
 *
 * @param ttl Default TTL for the cache (only used on first call)
 * @returns Global cache instance without context
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
 * @param context Optional context for multi-tenant cache isolation
 * @returns Cache key string
 */
export function generateDiscoverCacheKey(
  params: Record<string, any>,
  context?: CacheContext
): string {
  // Sort keys to ensure consistent key generation
  const sortedKeys = Object.keys(params).sort();
  const keyParts = sortedKeys.map(key => `${key}=${params[key]}`);
  const baseKey = `discover:${keyParts.join('&')}`;

  return applyContextPrefix(baseKey, context);
}

/**
 * Generates a cache key for watch providers
 * @param movieId Movie ID
 * @param region Region code
 * @param context Optional context for multi-tenant cache isolation
 * @returns Cache key string
 */
export function generateProvidersCacheKey(
  movieId: number | string,
  region: string,
  context?: CacheContext
): string {
  const baseKey = `providers:${movieId}:${region}`;

  return applyContextPrefix(baseKey, context);
}

import { Cache, getCache, resetCache, generateDiscoverCacheKey, generateProvidersCacheKey } from '../cache';

describe('Cache', () => {
  describe('basic operations', () => {
    let cache: Cache;

    beforeEach(() => {
      cache = new Cache(3600); // 1 hour default TTL
    });

    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should support complex data types', () => {
      const obj = { foo: 'bar', nested: { value: 42 } };
      cache.set('object', obj);
      expect(cache.get('object')).toEqual(obj);
    });

    it('should check if key exists with has()', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete keys', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.delete('key1')).toBe(false); // Already deleted
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.size()).toBe(0);
    });

    it('should report size correctly', () => {
      expect(cache.size()).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });
  });

  describe('TTL expiry', () => {
    let cache: Cache;

    beforeEach(() => {
      cache = new Cache(1); // 1 second default TTL
    });

    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should use custom TTL when provided', async () => {
      cache.set('key1', 'value1', 2); // 2 seconds
      
      // After 1 second, should still exist
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(cache.get('key1')).toBe('value1');
      
      // After 2 seconds, should expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should remove expired entries on access', async () => {
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Accessing expired entry should remove it
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.size()).toBe(0);
    });

    it('should not return expired entries with has()', async () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('prune()', () => {
    let cache: Cache;

    beforeEach(() => {
      cache = new Cache(1); // 1 second default TTL
    });

    it('should remove expired entries', async () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3', 10); // Long TTL
      
      expect(cache.size()).toBe(3);
      
      // Wait for first two to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const removed = cache.prune();
      expect(removed).toBe(2);
      expect(cache.size()).toBe(1);
      expect(cache.get('key3')).toBe('value3');
    });

    it('should return 0 when no entries expired', () => {
      cache.set('key1', 'value1', 10);
      cache.set('key2', 'value2', 10);
      
      const removed = cache.prune();
      expect(removed).toBe(0);
      expect(cache.size()).toBe(2);
    });
  });

  describe('singleton cache', () => {
    beforeEach(() => {
      resetCache();
    });

    afterEach(() => {
      resetCache();
    });

    it('should return the same instance', () => {
      const cache1 = getCache(3600);
      const cache2 = getCache(7200); // Different TTL shouldn't matter
      expect(cache1).toBe(cache2);
    });

    it('should share state between calls', () => {
      const cache1 = getCache(3600);
      cache1.set('key1', 'value1');
      
      const cache2 = getCache(3600);
      expect(cache2.get('key1')).toBe('value1');
    });

    it('should reset the singleton', () => {
      const cache1 = getCache(3600);
      cache1.set('key1', 'value1');
      
      resetCache();
      
      const cache2 = getCache(3600);
      expect(cache2.get('key1')).toBeUndefined();
    });
  });

  describe('cache key generation', () => {
    describe('generateDiscoverCacheKey', () => {
      it('should generate consistent keys for same parameters', () => {
        const params1 = { mood: 'happy', genre: 'Comedy', year: 2020 };
        const params2 = { mood: 'happy', genre: 'Comedy', year: 2020 };
        
        expect(generateDiscoverCacheKey(params1)).toBe(generateDiscoverCacheKey(params2));
      });

      it('should generate different keys for different parameters', () => {
        const params1 = { mood: 'happy', genre: 'Comedy' };
        const params2 = { mood: 'sad', genre: 'Drama' };
        
        expect(generateDiscoverCacheKey(params1)).not.toBe(generateDiscoverCacheKey(params2));
      });

      it('should generate consistent keys regardless of parameter order', () => {
        const params1 = { year: 2020, mood: 'happy', genre: 'Comedy' };
        const params2 = { genre: 'Comedy', mood: 'happy', year: 2020 };
        
        expect(generateDiscoverCacheKey(params1)).toBe(generateDiscoverCacheKey(params2));
      });

      it('should handle empty parameters', () => {
        const key = generateDiscoverCacheKey({});
        expect(key).toBe('discover:');
      });

      it('should include all parameter values in key', () => {
        const params = { mood: 'happy', page: 2 };
        const key = generateDiscoverCacheKey(params);
        
        expect(key).toContain('mood=happy');
        expect(key).toContain('page=2');
      });
    });

    describe('generateProvidersCacheKey', () => {
      it('should generate key with movieId and region', () => {
        const key = generateProvidersCacheKey(12345, 'CA');
        expect(key).toBe('providers:12345:CA');
      });

      it('should handle string movieId', () => {
        const key = generateProvidersCacheKey('12345', 'CA');
        expect(key).toBe('providers:12345:CA');
      });

      it('should generate different keys for different movies', () => {
        const key1 = generateProvidersCacheKey(12345, 'CA');
        const key2 = generateProvidersCacheKey(67890, 'CA');
        
        expect(key1).not.toBe(key2);
      });

      it('should generate different keys for different regions', () => {
        const key1 = generateProvidersCacheKey(12345, 'CA');
        const key2 = generateProvidersCacheKey(12345, 'US');
        
        expect(key1).not.toBe(key2);
      });
    });
  });

  describe('cache hit/miss behavior', () => {
    let cache: Cache;

    beforeEach(() => {
      cache = new Cache(3600);
    });

    it('should demonstrate cache miss on first access', () => {
      const key = 'test-key';
      expect(cache.get(key)).toBeUndefined(); // Cache miss
    });

    it('should demonstrate cache hit on subsequent access', () => {
      const key = 'test-key';
      const value = { data: 'test' };
      
      cache.set(key, value);
      expect(cache.get(key)).toEqual(value); // Cache hit
      expect(cache.get(key)).toEqual(value); // Another hit
    });

    it('should demonstrate cache miss after expiry', async () => {
      const shortCache = new Cache(1); // 1 second TTL
      const key = 'test-key';
      const value = 'test-value';
      
      shortCache.set(key, value);
      expect(shortCache.get(key)).toBe(value); // Cache hit
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(shortCache.get(key)).toBeUndefined(); // Cache miss after expiry
    });

    it('should demonstrate cache miss after deletion', () => {
      const key = 'test-key';
      const value = 'test-value';
      
      cache.set(key, value);
      expect(cache.get(key)).toBe(value); // Cache hit
      
      cache.delete(key);
      expect(cache.get(key)).toBeUndefined(); // Cache miss after deletion
    });
  });
});

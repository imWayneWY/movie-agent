import {
  Cache,
  getCache,
  resetCache,
  generateDiscoverCacheKey,
  generateProvidersCacheKey,
} from '../cache';

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

        expect(generateDiscoverCacheKey(params1)).toBe(
          generateDiscoverCacheKey(params2)
        );
      });

      it('should generate different keys for different parameters', () => {
        const params1 = { mood: 'happy', genre: 'Comedy' };
        const params2 = { mood: 'sad', genre: 'Drama' };

        expect(generateDiscoverCacheKey(params1)).not.toBe(
          generateDiscoverCacheKey(params2)
        );
      });

      it('should generate consistent keys regardless of parameter order', () => {
        const params1 = { year: 2020, mood: 'happy', genre: 'Comedy' };
        const params2 = { genre: 'Comedy', mood: 'happy', year: 2020 };

        expect(generateDiscoverCacheKey(params1)).toBe(
          generateDiscoverCacheKey(params2)
        );
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

  describe('multi-tenant cache isolation', () => {
    describe('Cache with context', () => {
      it('should isolate cache entries by userId', () => {
        const cacheUser1 = new Cache(3600, { userId: 'user1' });
        const cacheUser2 = new Cache(3600, { userId: 'user2' });

        cacheUser1.set('key1', 'user1-value');
        cacheUser2.set('key1', 'user2-value');

        expect(cacheUser1.get('key1')).toBe('user1-value');
        expect(cacheUser2.get('key1')).toBe('user2-value');
      });

      it('should isolate cache entries by sessionId', () => {
        const cacheSession1 = new Cache(3600, { sessionId: 'session1' });
        const cacheSession2 = new Cache(3600, { sessionId: 'session2' });

        cacheSession1.set('data', { session: 1 });
        cacheSession2.set('data', { session: 2 });

        expect(cacheSession1.get('data')).toEqual({ session: 1 });
        expect(cacheSession2.get('data')).toEqual({ session: 2 });
      });

      it('should isolate cache entries by tenantId', () => {
        const cacheTenant1 = new Cache(3600, { tenantId: 'tenant1' });
        const cacheTenant2 = new Cache(3600, { tenantId: 'tenant2' });

        cacheTenant1.set('config', { name: 'Tenant 1' });
        cacheTenant2.set('config', { name: 'Tenant 2' });

        expect(cacheTenant1.get('config')).toEqual({ name: 'Tenant 1' });
        expect(cacheTenant2.get('config')).toEqual({ name: 'Tenant 2' });
      });

      it('should support combined context isolation (tenant + user + session)', () => {
        const cache1 = new Cache(3600, {
          tenantId: 'tenant1',
          userId: 'user1',
          sessionId: 'session1',
        });
        const cache2 = new Cache(3600, {
          tenantId: 'tenant1',
          userId: 'user2',
          sessionId: 'session1',
        });

        cache1.set('preferences', { theme: 'dark' });
        cache2.set('preferences', { theme: 'light' });

        expect(cache1.get('preferences')).toEqual({ theme: 'dark' });
        expect(cache2.get('preferences')).toEqual({ theme: 'light' });
      });

      it('should not conflict with cache without context', () => {
        const cacheWithContext = new Cache(3600, { userId: 'user1' });
        const cacheWithoutContext = new Cache(3600);

        cacheWithContext.set('key1', 'context-value');
        cacheWithoutContext.set('key1', 'no-context-value');

        expect(cacheWithContext.get('key1')).toBe('context-value');
        expect(cacheWithoutContext.get('key1')).toBe('no-context-value');
      });

      it('should properly delete entries with context', () => {
        const cacheUser1 = new Cache(3600, { userId: 'user1' });
        const cacheUser2 = new Cache(3600, { userId: 'user2' });

        cacheUser1.set('key1', 'value1');
        cacheUser2.set('key1', 'value2');

        expect(cacheUser1.delete('key1')).toBe(true);
        expect(cacheUser1.get('key1')).toBeUndefined();
        expect(cacheUser2.get('key1')).toBe('value2'); // User2's data should remain
      });

      it('should check existence with has() using context', () => {
        const cacheUser1 = new Cache(3600, { userId: 'user1' });
        const cacheUser2 = new Cache(3600, { userId: 'user2' });

        cacheUser1.set('key1', 'value1');

        expect(cacheUser1.has('key1')).toBe(true);
        expect(cacheUser2.has('key1')).toBe(false);
      });

      it('should handle partial context (only some fields)', () => {
        const cacheWithTenant = new Cache(3600, { tenantId: 'tenant1' });
        const cacheWithUser = new Cache(3600, { userId: 'user1' });

        cacheWithTenant.set('data', 'tenant-data');
        cacheWithUser.set('data', 'user-data');

        expect(cacheWithTenant.get('data')).toBe('tenant-data');
        expect(cacheWithUser.get('data')).toBe('user-data');
      });
    });

    describe('generateDiscoverCacheKey with context', () => {
      it('should generate key without context prefix by default', () => {
        const params = { mood: 'happy', genre: 'Comedy' };
        const key = generateDiscoverCacheKey(params);

        expect(key).toBe('discover:genre=Comedy&mood=happy');
        expect(key).not.toContain('tenant:');
        expect(key).not.toContain('user:');
      });

      it('should prefix key with userId when provided', () => {
        const params = { mood: 'happy' };
        const context = { userId: 'user123' };
        const key = generateDiscoverCacheKey(params, context);

        expect(key).toContain('user:user123');
        expect(key).toContain('discover:mood=happy');
      });

      it('should prefix key with sessionId when provided', () => {
        const params = { genre: 'Action' };
        const context = { sessionId: 'session456' };
        const key = generateDiscoverCacheKey(params, context);

        expect(key).toContain('session:session456');
        expect(key).toContain('discover:genre=Action');
      });

      it('should prefix key with tenantId when provided', () => {
        const params = { year: 2020 };
        const context = { tenantId: 'tenant789' };
        const key = generateDiscoverCacheKey(params, context);

        expect(key).toContain('tenant:tenant789');
        expect(key).toContain('discover:year=2020');
      });

      it('should include all context fields in correct order (tenant > user > session)', () => {
        const params = { mood: 'excited' };
        const context = {
          tenantId: 'tenant1',
          userId: 'user2',
          sessionId: 'session3',
        };
        const key = generateDiscoverCacheKey(params, context);

        expect(key).toBe('tenant:tenant1:user:user2:session:session3:discover:mood=excited');
      });

      it('should generate different keys for different contexts with same params', () => {
        const params = { mood: 'happy' };
        const key1 = generateDiscoverCacheKey(params, { userId: 'user1' });
        const key2 = generateDiscoverCacheKey(params, { userId: 'user2' });

        expect(key1).not.toBe(key2);
      });
    });

    describe('generateProvidersCacheKey with context', () => {
      it('should generate key without context prefix by default', () => {
        const key = generateProvidersCacheKey(12345, 'CA');

        expect(key).toBe('providers:12345:CA');
        expect(key).not.toContain('tenant:');
        expect(key).not.toContain('user:');
      });

      it('should prefix key with userId when provided', () => {
        const context = { userId: 'user123' };
        const key = generateProvidersCacheKey(12345, 'CA', context);

        expect(key).toContain('user:user123');
        expect(key).toContain('providers:12345:CA');
      });

      it('should prefix key with tenantId when provided', () => {
        const context = { tenantId: 'tenant789' };
        const key = generateProvidersCacheKey(67890, 'US', context);

        expect(key).toContain('tenant:tenant789');
        expect(key).toContain('providers:67890:US');
      });

      it('should include all context fields in correct order', () => {
        const context = {
          tenantId: 'tenant1',
          userId: 'user2',
          sessionId: 'session3',
        };
        const key = generateProvidersCacheKey(12345, 'CA', context);

        expect(key).toBe('tenant:tenant1:user:user2:session:session3:providers:12345:CA');
      });

      it('should generate different keys for different contexts with same params', () => {
        const key1 = generateProvidersCacheKey(12345, 'CA', { userId: 'user1' });
        const key2 = generateProvidersCacheKey(12345, 'CA', { userId: 'user2' });

        expect(key1).not.toBe(key2);
      });
    });

    describe('cache poisoning prevention', () => {
      it('should prevent cache poisoning between different tenants', () => {
        const cacheTenant1 = new Cache(3600, { tenantId: 'tenant1' });
        const cacheTenant2 = new Cache(3600, { tenantId: 'tenant2' });

        // Tenant 1 sets sensitive data
        cacheTenant1.set('api-response', { secret: 'tenant1-secret' });

        // Tenant 2 tries to read the same key
        const tenant2Data = cacheTenant2.get('api-response');

        // Tenant 2 should not be able to access Tenant 1's data
        expect(tenant2Data).toBeUndefined();
      });

      it('should prevent data leakage between users in same tenant', () => {
        const cacheUser1 = new Cache(3600, {
          tenantId: 'tenant1',
          userId: 'user1',
        });
        const cacheUser2 = new Cache(3600, {
          tenantId: 'tenant1',
          userId: 'user2',
        });

        // User 1 sets personal data
        cacheUser1.set('profile', { email: 'user1@example.com' });

        // User 2 tries to read the same key
        const user2Profile = cacheUser2.get('profile');

        // User 2 should not be able to access User 1's profile
        expect(user2Profile).toBeUndefined();
      });

      it('should prevent session hijacking through cache', () => {
        const cacheSession1 = new Cache(3600, {
          userId: 'user1',
          sessionId: 'session1',
        });
        const cacheSession2 = new Cache(3600, {
          userId: 'user1',
          sessionId: 'session2',
        });

        // Session 1 stores authentication token
        cacheSession1.set('auth-token', 'secret-token-123');

        // Different session tries to access the token
        const session2Token = cacheSession2.get('auth-token');

        // Different session should not be able to access the token
        expect(session2Token).toBeUndefined();
      });
    });
  });
});

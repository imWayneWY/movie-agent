# Cache Isolation for Multi-Tenant Scenarios

## Overview

The cache implementation in `src/cache.ts` supports multi-tenant scenarios through optional context-based key isolation. This feature prevents cache poisoning and data leakage between different users, sessions, or tenants when the application is deployed in a multi-user environment.

## Security Concerns

In multi-tenant scenarios, without proper cache isolation:

- **Cache Poisoning**: One tenant could potentially poison the cache for other tenants
- **Data Leakage**: User-specific data could be accessed by other users if cache keys collide
- **Session Hijacking**: Session-specific data could leak across different sessions

## Solution: Context-Based Cache Isolation

The cache now supports an optional `CacheContext` parameter that automatically prefixes cache keys with tenant, user, and session identifiers.

### CacheContext Interface

```typescript
interface CacheContext {
  /** User identifier for user-specific cache isolation */
  userId?: string;
  /** Session identifier for session-specific cache isolation */
  sessionId?: string;
  /** Tenant identifier for multi-tenant cache isolation */
  tenantId?: string;
}
```

## Usage Examples

### 1. Default Behavior (No Context)

Current CLI usage continues to work unchanged:

```typescript
import { Cache } from './cache';

// No context - works as before
const cache = new Cache(3600);
cache.set('key1', 'value1');
console.log(cache.get('key1')); // 'value1'
```

### 2. User-Specific Caching

Isolate cache entries per user:

```typescript
import { Cache } from './cache';

const cacheUser1 = new Cache(3600, { userId: 'user123' });
const cacheUser2 = new Cache(3600, { userId: 'user456' });

cacheUser1.set('preferences', { theme: 'dark' });
cacheUser2.set('preferences', { theme: 'light' });

// Each user gets their own cached data
console.log(cacheUser1.get('preferences')); // { theme: 'dark' }
console.log(cacheUser2.get('preferences')); // { theme: 'light' }
```

### 3. Session-Specific Caching

Isolate cache entries per session:

```typescript
import { Cache } from './cache';

const cacheSession1 = new Cache(3600, { sessionId: 'sess-abc' });
const cacheSession2 = new Cache(3600, { sessionId: 'sess-xyz' });

cacheSession1.set('auth-token', 'token-123');

// Different sessions cannot access each other's data
console.log(cacheSession1.get('auth-token')); // 'token-123'
console.log(cacheSession2.get('auth-token')); // undefined
```

### 4. Multi-Tenant Caching

Isolate cache entries per tenant in a SaaS application:

```typescript
import { Cache } from './cache';

const cacheTenant1 = new Cache(3600, { tenantId: 'company-a' });
const cacheTenant2 = new Cache(3600, { tenantId: 'company-b' });

cacheTenant1.set('api-response', { data: 'sensitive-company-a-data' });
cacheTenant2.set('api-response', { data: 'sensitive-company-b-data' });

// Each tenant's data is completely isolated
console.log(cacheTenant1.get('api-response')); // Company A's data
console.log(cacheTenant2.get('api-response')); // Company B's data
```

### 5. Combined Context (Tenant + User + Session)

For maximum isolation, combine all context levels:

```typescript
import { Cache } from './cache';

const cache = new Cache(3600, {
  tenantId: 'company-a',
  userId: 'user123',
  sessionId: 'sess-abc'
});

cache.set('cart', { items: ['item1', 'item2'] });

// This cache entry is isolated to this specific tenant, user, and session
```

## Cache Key Generation with Context

The helper functions `generateDiscoverCacheKey` and `generateProvidersCacheKey` also support context:

### generateDiscoverCacheKey with Context

```typescript
import { generateDiscoverCacheKey } from './cache';

const params = { mood: 'happy', genre: 'Comedy' };

// Without context (default behavior)
const key1 = generateDiscoverCacheKey(params);
// Result: "discover:genre=Comedy&mood=happy"

// With user context
const key2 = generateDiscoverCacheKey(params, { userId: 'user123' });
// Result: "user:user123:discover:genre=Comedy&mood=happy"

// With full context
const key3 = generateDiscoverCacheKey(params, {
  tenantId: 'tenant1',
  userId: 'user123',
  sessionId: 'sess-abc'
});
// Result: "tenant:tenant1:user:user123:session:sess-abc:discover:genre=Comedy&mood=happy"
```

### generateProvidersCacheKey with Context

```typescript
import { generateProvidersCacheKey } from './cache';

// Without context (default behavior)
const key1 = generateProvidersCacheKey(12345, 'CA');
// Result: "providers:12345:CA"

// With context
const key2 = generateProvidersCacheKey(12345, 'CA', { userId: 'user123' });
// Result: "user:user123:providers:12345:CA"
```

## Context Prefixing Order

When multiple context fields are provided, they are applied in this order:

1. `tenantId` (highest level)
2. `userId` (middle level)
3. `sessionId` (lowest level)

This creates a hierarchical isolation pattern:

```
tenant:tenant1:user:user123:session:sess-abc:actual-cache-key
```

## Integration Patterns

### Pattern 1: Web API with User Authentication

```typescript
import { Cache } from './cache';

// In your request handler
app.get('/api/recommendations', async (req, res) => {
  const userId = req.user.id;
  const cache = new Cache(3600, { userId });
  
  // User-specific cache that won't leak to other users
  const cacheKey = 'recent-recommendations';
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return res.json(cached);
  }
  
  // Fetch and cache new data
  const data = await fetchRecommendations(userId);
  cache.set(cacheKey, data);
  res.json(data);
});
```

### Pattern 2: SaaS Application with Multiple Tenants

```typescript
import { Cache } from './cache';

// Middleware to create tenant-specific cache
function tenantCacheMiddleware(req, res, next) {
  req.cache = new Cache(3600, {
    tenantId: req.tenant.id,
    userId: req.user.id
  });
  next();
}

// Use in routes
app.get('/api/movies', async (req, res) => {
  // Each tenant has isolated cache
  const cached = req.cache.get('movie-list');
  // ...
});
```

### Pattern 3: Separate Cache Instances per Tenant

For complete isolation, create separate cache instances:

```typescript
import { Cache } from './cache';

class TenantCacheManager {
  private caches: Map<string, Cache> = new Map();
  
  getCacheForTenant(tenantId: string): Cache {
    if (!this.caches.has(tenantId)) {
      this.caches.set(
        tenantId,
        new Cache(3600, { tenantId })
      );
    }
    return this.caches.get(tenantId)!;
  }
  
  clearTenantCache(tenantId: string): void {
    const cache = this.caches.get(tenantId);
    if (cache) {
      cache.clear();
      this.caches.delete(tenantId);
    }
  }
}

// Usage
const manager = new TenantCacheManager();
const tenantCache = manager.getCacheForTenant('company-a');
```

## Backward Compatibility

All changes maintain **100% backward compatibility**:

- Existing code without context continues to work unchanged
- The `context` parameter is optional in all functions
- Default behavior (no context) is identical to previous implementation
- All existing tests pass without modification

## Testing

The implementation includes comprehensive tests covering:

- Basic cache isolation by userId, sessionId, and tenantId
- Combined context isolation
- Cache poisoning prevention
- Data leakage prevention
- Session hijacking prevention
- Backward compatibility verification

See `src/__tests__/cache.test.ts` for complete test coverage.

## Performance Considerations

- Context prefixing adds minimal overhead (simple string concatenation)
- No performance impact when context is not used (default behavior)
- Key generation is deterministic and efficient

## Best Practices

1. **Choose the Right Level**: Use the minimum context needed for your use case
   - CLI apps: No context needed
   - Single-user web apps: User context
   - Multi-tenant SaaS: Tenant + User context

2. **Consistent Context**: Always use the same context structure throughout your application

3. **Clear on Logout**: Clear user/session-specific cache entries when users log out

4. **TTL Strategy**: Set appropriate TTL values based on data sensitivity
   - Shorter TTL for sensitive data
   - Longer TTL for public data

5. **Documentation**: Document your context strategy in your application code

## Future Enhancements

Potential future improvements:

- Namespace-based isolation
- Cache statistics per context
- Automatic cleanup of tenant caches
- Redis/external cache backend with context support

## Migration Guide

### For Current CLI Users

**No action required.** The current implementation continues to work without any changes.

### For Future Multi-User Deployments

When expanding to multi-user scenarios:

1. Identify where user/session/tenant data is cached
2. Add appropriate context to Cache constructor
3. Update cache key generation to include context
4. Test isolation between different contexts
5. Implement cache cleanup on user logout/session expiry

## Conclusion

The cache isolation feature provides a secure foundation for future multi-tenant deployments while maintaining complete backward compatibility with the current CLI usage. The optional nature of the context parameter ensures that the feature can be adopted gradually as the application scales.

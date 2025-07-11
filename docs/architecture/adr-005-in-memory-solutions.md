# ADR-005: In-memory Solutions Over External Services

## Status
Accepted

## Context
Applications often need caching, rate limiting, session management, and temporary data storage. The default approach is often to add external services like Redis, Memcached, or dedicated cache/queue services.

## Decision
Use in-memory solutions for caching, rate limiting, and temporary data storage instead of external services, where appropriate for the application's scale and requirements.

## Consequences

### Positive
- **Simplified deployment**: No external services to manage
- **Lower operational complexity**: Fewer moving parts to monitor
- **Reduced latency**: In-memory access is faster than network calls
- **Cost efficiency**: No additional service costs
- **Simplified development**: No additional service setup for development
- **Better reliability**: No external service dependencies

### Negative
- **Memory limitations**: Limited by available server memory
- **No persistence**: Data lost on server restart
- **No horizontal scaling**: Cannot share state across multiple instances
- **Limited functionality**: Fewer features compared to dedicated services

## Current Implementation Examples

### Rate Limiting
```typescript
// In-memory rate limiting implementation
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (entry.count >= limit) {
    return false;
  }
  
  entry.count += 1;
  return true;
}
```

### Calendar Data Caching
```typescript
// In-memory calendar caching
const calendarCache = new Map<string, { data: CalendarData; expiry: number }>();

export function getCachedCalendars(integrationId: string): CalendarData | null {
  const entry = calendarCache.get(integrationId);
  
  if (!entry || Date.now() > entry.expiry) {
    calendarCache.delete(integrationId);
    return null;
  }
  
  return entry.data;
}

export function setCachedCalendars(integrationId: string, data: CalendarData, ttlMs: number): void {
  calendarCache.set(integrationId, {
    data,
    expiry: Date.now() + ttlMs
  });
}
```

### Session Management
```typescript
// In-memory session store for temporary data
const sessionStore = new Map<string, { data: any; expiry: number }>();

export function getSession(sessionId: string): any | null {
  const entry = sessionStore.get(sessionId);
  
  if (!entry || Date.now() > entry.expiry) {
    sessionStore.delete(sessionId);
    return null;
  }
  
  return entry.data;
}
```

## Appropriate Use Cases

### ✅ Good for In-memory Solutions
- **Rate limiting**: API rate limiting with reasonable limits
- **Temporary caching**: Calendar data, configuration data
- **Session data**: Short-lived user sessions
- **Debouncing**: Preventing duplicate operations
- **Simple counters**: Basic metrics and counters
- **Request deduplication**: Preventing duplicate requests

### ❌ Not Suitable for In-memory Solutions
- **User authentication**: Should use secure, persistent storage
- **Business data**: Critical data that must survive restarts
- **Large datasets**: Data that exceeds memory capacity
- **Multi-instance deployment**: When state needs to be shared
- **Long-term storage**: Data needed for extended periods

## Implementation Patterns

### 1. Map-based Storage
```typescript
// Simple key-value storage
const store = new Map<string, any>();

// With expiration
const storeWithTTL = new Map<string, { data: any; expiry: number }>();
```

### 2. LRU Cache Implementation
```typescript
class LRUCache<T> {
  private cache = new Map<string, T>();
  private maxSize: number;
  
  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }
  
  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

### 3. Cleanup and Memory Management
```typescript
// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of storeWithTTL.entries()) {
    if (now > entry.expiry) {
      storeWithTTL.delete(key);
    }
  }
}, 60000); // Clean up every minute
```

## Memory Management Strategies

### 1. Size Limits
```typescript
const MAX_CACHE_SIZE = 1000;
const cache = new LRUCache<CacheEntry>(MAX_CACHE_SIZE);
```

### 2. Time-based Expiration
```typescript
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const entry = { data, expiry: Date.now() + DEFAULT_TTL };
```

### 3. Automatic Cleanup
```typescript
// Clean up expired entries periodically
const cleanupInterval = setInterval(() => {
  cleanupExpiredEntries();
}, 60000);

// Clean up on process exit
process.on('exit', () => {
  clearInterval(cleanupInterval);
});
```

## Monitoring and Metrics

### Memory Usage Tracking
```typescript
export function getCacheStats() {
  return {
    size: cache.size,
    memoryUsage: process.memoryUsage(),
    hitRate: hits / (hits + misses),
  };
}
```

### Performance Monitoring
```typescript
const startTime = Date.now();
const result = getCachedData(key);
const duration = Date.now() - startTime;

// Log slow operations
if (duration > 100) {
  console.warn(`Slow cache operation: ${duration}ms`);
}
```

## Alternatives Considered

### Redis
- **Pros**: Persistent, distributed, feature-rich
- **Cons**: Additional service complexity, network latency
- **Why rejected**: Unnecessary complexity for current scale

### Memcached
- **Pros**: Simple, fast, distributed
- **Cons**: Additional service to manage
- **Why rejected**: In-memory solutions are sufficient

### Database Caching
- **Pros**: Persistent, consistent
- **Cons**: Slower than memory, database overhead
- **Why rejected**: Memory is faster for frequently accessed data

## When to Reconsider

Consider external services when:
- **Multi-instance deployment**: Need shared state across instances
- **High availability requirements**: Need persistent caching
- **Large datasets**: Memory requirements exceed server capacity
- **Complex caching patterns**: Need advanced features (pub/sub, etc.)
- **Regulatory compliance**: Need persistent audit trails

## Migration Strategy

If external services become necessary:

1. **Identify bottlenecks**: Monitor memory usage and performance
2. **Gradual migration**: Start with specific use cases
3. **Maintain compatibility**: Keep in-memory as fallback
4. **Performance testing**: Ensure external service improves performance

## Related Decisions
- [ADR-004: Minimal Dependencies Approach](./adr-004-minimal-dependencies.md)
- [ADR-001: Manual State Management Over Libraries](./adr-001-manual-state-management.md)
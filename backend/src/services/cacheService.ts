import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

export function getCached<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function setCache<T>(key: string, value: T, ttl?: number): void {
  if (ttl !== undefined) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
}

export function deleteCache(key: string): void {
  cache.del(key);
}

export function deleteCacheByPrefix(prefix: string): void {
  const keys = cache.keys();
  const matchingKeys = keys.filter(k => k.startsWith(prefix));
  cache.del(matchingKeys);
}

export function generateCacheKey(...parts: string[]): string {
  return parts.join(':');
}

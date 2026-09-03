import { getRedisClient } from '../config/redis';
import { recordMetric } from './metricsService';

const PREFIX = 'cache:';

export async function getCached<T>(key: string): Promise<T | undefined> {
  const redis = getRedisClient();
  const payload = await redis.get(`${PREFIX}${key}`);
  if (!payload) {
    recordMetric('cache_misses_total');
    return undefined;
  }
  recordMetric('cache_hits_total');
  return JSON.parse(payload) as T;
}

export async function setCache<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
  const redis = getRedisClient();
  await redis.set(`${PREFIX}${key}`, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function deleteCache(key: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(`${PREFIX}${key}`);
}

export async function deleteCacheByPrefix(prefix: string): Promise<void> {
  const redis = getRedisClient();
  const match = `${PREFIX}${prefix}*`;
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', match, 'COUNT', 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } while (cursor !== '0');
}

export function generateCacheKey(...parts: string[]): string {
  return parts.join(':');
}

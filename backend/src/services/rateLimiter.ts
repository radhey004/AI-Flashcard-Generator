import { RateLimiterRedis } from 'rate-limiter-flexible';
import { getRedisClient } from '../config/redis';

const redisClient = getRedisClient();

const aiLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl:ai',
    points: Number(process.env.AI_RATE_LIMIT_POINTS || 8),
    duration: Number(process.env.AI_RATE_LIMIT_WINDOW_SECONDS || 3600),
});

export async function consumeAiPoints(key: string): Promise<void> {
    await aiLimiter.consume(key, 1);
}
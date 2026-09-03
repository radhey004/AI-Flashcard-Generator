import IORedis from 'ioredis';

let redisClient: IORedis | null = null;

export function getRedisClient(): IORedis {
    if (!redisClient) {
        redisClient = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            lazyConnect: true,
        });
    }

    return redisClient;
}

export async function closeRedisClient(): Promise<void> {
    if (redisClient) {
        if (redisClient.status !== 'end') {
            await redisClient.quit();
        }
        redisClient = null;
    }
}
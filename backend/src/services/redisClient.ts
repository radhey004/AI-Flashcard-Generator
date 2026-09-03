import { getRedisClient } from '../config/redis';

export async function connectRedis(): Promise<void> {
    const client = getRedisClient();

    if (client.status === 'ready' || client.status === 'connecting') {
        return;
    }

    await client.connect();
}

export async function disconnectRedis(): Promise<void> {
    const client = getRedisClient();

    if (client.status !== 'end') {
        await client.quit();
    }
}
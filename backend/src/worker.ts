import dotenv from 'dotenv';
import { createAiWorker } from './jobs/aiQueue';
import { logger } from './services/logger';
import { connectRedis } from './services/redisClient';

dotenv.config();

async function main(): Promise<void> {
    await connectRedis();
    const worker = createAiWorker();
    worker.on('completed', (job) => logger.info({ jobId: job.id, kind: job.name }, 'ai job completed'));
    worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'ai job failed'));
    logger.info('AI worker started');
}

void main().catch((err) => {
    logger.error({ err }, 'worker failed to start');
    process.exit(1);
});
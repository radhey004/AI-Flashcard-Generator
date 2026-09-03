import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { recordMetric } from '../services/metricsService';
import { generateFlashcardsFromPdf, generateFlashcardsFromText, generateFlashcardsFromYouTube } from '../services/aiClient';
import { setCache, generateCacheKey } from '../services/cacheService';

export type AiJobKind = 'text' | 'pdf' | 'youtube';

export interface AiJobPayload {
    kind: AiJobKind;
    userId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    count: number;
    text?: string;
    pdf_base64?: string;
    filename?: string;
    url?: string;
}

const connection = getRedisClient();

export const aiQueue = new Queue<AiJobPayload>('ai-generation', { connection });
export const aiQueueEvents = new QueueEvents('ai-generation', { connection });

export async function enqueueAiJob(payload: AiJobPayload): Promise<Job<AiJobPayload>> {
    recordMetric('ai_jobs_total');
    return aiQueue.add(payload.kind, payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 86400, count: 1000 },
        removeOnFail: { age: 7 * 86400 },
    });
}

export function createAiWorker() {
    return new Worker<AiJobPayload>('ai-generation', async (job) => {
        await job.updateProgress(10);
        const { kind, difficulty, count } = job.data;

        if (kind === 'text' && job.data.text) {
            const result = await generateFlashcardsFromText({ text: job.data.text, difficulty, count });
            // cache the result for quick retrieval
            try {
                const key = generateCacheKey('ai:text', job.data.userId, difficulty, String(count), String(job.data.text).slice(0, 100));
                await setCache(key, result, 3600);
            } catch (e) {
                // swallow caching errors
            }
            await job.updateProgress(100);
            return result;
        }

        if (kind === 'pdf' && job.data.pdf_base64 && job.data.filename) {
            const result = await generateFlashcardsFromPdf({ pdf_base64: job.data.pdf_base64, filename: job.data.filename, difficulty, count });
            try {
                const key = generateCacheKey('ai:pdf', job.data.userId, job.data.filename, difficulty, String(count));
                await setCache(key, result, 3600);
            } catch (e) { }
            await job.updateProgress(100);
            return result;
        }

        if (kind === 'youtube' && job.data.url) {
            const result = await generateFlashcardsFromYouTube({ url: job.data.url, difficulty, count });
            try {
                const key = generateCacheKey('ai:youtube', job.data.userId, job.data.url, difficulty, String(count));
                await setCache(key, result, 3600);
            } catch (e) { }
            await job.updateProgress(100);
            return result;
        }

        throw new Error('Invalid AI job payload');
    }, { connection, concurrency: Number(process.env.AI_WORKER_CONCURRENCY || 2) });
}

aiQueueEvents.on('failed', () => {
    recordMetric('ai_jobs_failed_total');
});
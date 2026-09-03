import { Response } from 'express';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';
import { enqueueAiJob, aiQueue } from '../jobs/aiQueue';
import { generateCacheKey, getCached } from '../services/cacheService';
import { consumeAiPoints } from '../services/rateLimiter';
import { AppError } from '../errors/AppError';

function toNumber(value: unknown, fallback: number): number {
    const parsed = typeof value === 'string' ? Number(value) : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export const generateFromText = async (req: AuthRequest, res: Response): Promise<void> => {
    const { text, difficulty, count } = req.body;
    if (!text || text.trim().length < 50) {
        res.status(400).json({ message: 'Text must be at least 50 characters' });
        return;
    }

    const userId = String(req.userId);
    const key = generateCacheKey('ai:text', userId, difficulty || 'medium', String(count || 10), text.slice(0, 100));

    try {
        const cached = await getCached<any>(key);
        if (cached) { res.json(cached); return; }

        await consumeAiPoints(`user:${userId}`);
        const job = await enqueueAiJob({ kind: 'text', userId, text, difficulty: difficulty || 'medium', count: Number(count) || 10 });
        res.status(202).json({ jobId: String(job.id), status: 'queued' });
    } catch (err) {
        if (err instanceof AppError) throw err;
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
};

export const generateFromPDF = async (req: AuthRequest & { file?: Express.Multer.File }, res: Response): Promise<void> => {
    if (!req.file) { res.status(400).json({ message: 'PDF file is required' }); return; }
    const difficulty = typeof req.body.difficulty === 'string' ? req.body.difficulty : 'medium';
    const count = toNumber(req.body.count, 10);

    const userId = String(req.userId);

    try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const base64 = fileBuffer.toString('base64');
        try { fs.unlinkSync(req.file.path); } catch { }

        const key = generateCacheKey('ai:pdf', userId, req.file.originalname, difficulty || 'medium', String(count || 10));
        const cached = await getCached<any>(key);
        if (cached) { res.json(cached); return; }

        await consumeAiPoints(`user:${userId}`);
        const job = await enqueueAiJob({ kind: 'pdf', userId, pdf_base64: base64, filename: req.file.originalname, difficulty, count });
        res.status(202).json({ jobId: String(job.id), status: 'queued' });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch { }
        }
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
};

export const generateFromYouTube = async (req: AuthRequest, res: Response): Promise<void> => {
    const { url, difficulty, count } = req.body;
    if (!url) { res.status(400).json({ message: 'YouTube URL is required' }); return; }

    const userId = String(req.userId);
    const key = generateCacheKey('ai:youtube', userId, url, difficulty || 'medium', String(count || 10));

    try {
        const cached = await getCached<any>(key);
        if (cached) { res.json(cached); return; }

        await consumeAiPoints(`user:${userId}`);
        const job = await enqueueAiJob({ kind: 'youtube', userId, url, difficulty: difficulty || 'medium', count: Number(count) || 10 });
        res.status(202).json({ jobId: String(job.id), status: 'queued' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
};

export const getAiJobStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params as { id?: string };
    if (!id) { res.status(400).json({ message: 'Job id is required' }); return; }

    try {
        const job = await aiQueue.getJob(id);
        if (!job) { res.status(404).json({ message: 'Job not found' }); return; }
        if (String(job.data.userId) !== String(req.userId)) { res.status(403).json({ message: 'Forbidden' }); return; }

        const state = await job.getState();
        res.json({ jobId: String(job.id), status: state, progress: job.progress, result: job.returnvalue || null, failedReason: job.failedReason || null, attemptsMade: job.attemptsMade });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
};

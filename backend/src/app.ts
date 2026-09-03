import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import authRoutes from './routes/auth';
import deckRoutes from './routes/decks';
import flashcardRoutes from './routes/flashcards';
import aiRoutes from './routes/ai';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestContext } from './middleware/requestContext';
import { logger } from './services/logger';

export function createApp() {
    const app = express();

    app.use((req, res, next) => requestContext(req, res, next));
    app.use(pinoHttp({
        logger,
        genReqId: (req) => String((req as express.Request & { id?: string | number }).id || req.headers['x-request-id'] || ''),
        customProps: (req) => ({ requestId: String((req as express.Request & { id?: string | number }).id || req.headers['x-request-id'] || '') }),
        redact: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
    }));
    app.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    }));
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/decks', deckRoutes);
    app.use('/api/flashcards', flashcardRoutes);
    app.use('/api/ai', aiRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

export default createApp();
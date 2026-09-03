import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { logger } from '../services/logger';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
    next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
    const requestId = (req as Request & { id?: string }).id;

    if (err instanceof ZodError) {
        res.status(400).json({
            message: 'Validation failed',
            requestId,
            issues: err.issues,
        });
        return;
    }

    if (err instanceof AppError) {
        if (err.statusCode >= 500) {
            logger.error({ err, requestId, path: req.path, method: req.method }, 'request failed');
        }
        res.status(err.statusCode).json({
            message: err.message,
            requestId,
            details: err.details,
        });
        return;
    }

    logger.error({ err, requestId, path: req.path, method: req.method }, 'unexpected error');
    res.status(500).json({
        message: 'Server error',
        requestId,
    });
}
import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';

export function requestContext(req: Request, res: Response, next: NextFunction): void {
    const requestWithId = req as Request & { id?: string | number };
    const requestId = req.header('x-request-id') || crypto.randomUUID();
    requestWithId.id = requestId;
    res.setHeader('x-request-id', requestId);
    next();
}
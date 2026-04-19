import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';
import fs from 'fs';
import { getCached, setCache, generateCacheKey } from '../services/cacheService';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const generateFromText = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, difficulty, count } = req.body;
    if (!text || text.trim().length < 50) {
      res.status(400).json({ message: 'Text must be at least 50 characters' });
      return;
    }
    const cacheKey = generateCacheKey('ai:text', String(req.userId), difficulty || 'medium', String(count || 10), text.slice(0, 100));
    const cached = getCached<{ flashcards: unknown[] }>(cacheKey);
    if (cached) { res.json(cached); return; }

    const response = await axios.post(`${AI_SERVICE_URL}/generate/text`, {
      text, difficulty: difficulty || 'medium', count: count || 10,
    }, { timeout: 60000 });

    setCache(cacheKey, response.data, 3600);
    res.json(response.data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      res.status(err.response?.status || 500).json({ message: err.response?.data?.detail || 'AI service error' });
    } else {
      res.status(500).json({ message: 'Server error', error: String(err) });
    }
  }
};

export const generateFromPDF = async (req: AuthRequest & { file?: Express.Multer.File }, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ message: 'PDF file is required' }); return; }
    const { difficulty, count } = req.body;

    const fileBuffer = fs.readFileSync(req.file.path);
    const base64 = fileBuffer.toString('base64');
    fs.unlinkSync(req.file.path);

    const response = await axios.post(`${AI_SERVICE_URL}/generate/pdf`, {
      pdf_base64: base64,
      filename: req.file.originalname,
      difficulty: difficulty || 'medium',
      count: parseInt(count) || 10,
    }, { timeout: 120000 });

    res.json(response.data);
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (axios.isAxiosError(err)) {
      res.status(err.response?.status || 500).json({ message: err.response?.data?.detail || 'AI service error' });
    } else {
      res.status(500).json({ message: 'Server error', error: String(err) });
    }
  }
};

export const generateFromYouTube = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url, difficulty, count } = req.body;
    if (!url) { res.status(400).json({ message: 'YouTube URL is required' }); return; }

    const cacheKey = generateCacheKey('ai:youtube', String(req.userId), url, difficulty || 'medium', String(count || 10));
    const cached = getCached<{ flashcards: unknown[] }>(cacheKey);
    if (cached) { res.json(cached); return; }

    const response = await axios.post(`${AI_SERVICE_URL}/generate/youtube`, {
      url, difficulty: difficulty || 'medium', count: count || 10,
    }, { timeout: 120000 });

    setCache(cacheKey, response.data, 3600);
    res.json(response.data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      res.status(err.response?.status || 500).json({ message: err.response?.data?.detail || 'AI service error' });
    } else {
      res.status(500).json({ message: 'Server error', error: String(err) });
    }
  }
};

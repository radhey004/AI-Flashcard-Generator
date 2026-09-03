import { z } from 'zod';

export const difficultySchema = z.enum(['easy', 'medium', 'hard']).default('medium');

export const generateTextSchema = z.object({
    text: z.string().trim().min(50),
    difficulty: difficultySchema.optional(),
    count: z.number().int().min(1).max(Number(process.env.MAX_FLASHCARDS_PER_REQUEST || 30)).optional(),
});

export const generateYouTubeSchema = z.object({
    url: z.string().trim().url(),
    difficulty: difficultySchema.optional(),
    count: z.number().int().min(1).max(Number(process.env.MAX_FLASHCARDS_PER_REQUEST || 30)).optional(),
});

export const aiJobIdSchema = z.object({
    id: z.string().min(1),
});
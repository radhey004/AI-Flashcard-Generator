import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import app from './app';
import { logger } from './services/logger';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/ai_flashcard_db';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

mongoose.connect(MONGODB_URI)
    .then(() => {
        logger.info('Connected to MongoDB');
        app.listen(PORT, () => {
            logger.info({ port: PORT }, 'Server running');
        });
    })
    .catch((err) => {
        logger.error({ err }, 'startup failed');
        process.exit(1);
    });

export default app;

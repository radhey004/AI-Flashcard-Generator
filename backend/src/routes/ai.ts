import { Router } from 'express';
import { generateFromText, generateFromPDF, generateFromYouTube, getAiJobStatus } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { uploadPDF } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.post('/generate/text', generateFromText);
router.post('/generate/pdf', uploadPDF.single('pdf'), generateFromPDF);
router.post('/generate/youtube', generateFromYouTube);
router.get('/job/:id', getAiJobStatus);

export default router;

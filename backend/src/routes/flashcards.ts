import { Router } from 'express';
import {
  getFlashcards, createFlashcard, bulkCreateFlashcards,
  updateFlashcard, deleteFlashcard, reviewFlashcard,
} from '../controllers/flashcardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getFlashcards);
router.post('/', createFlashcard);
router.post('/bulk', bulkCreateFlashcards);
router.put('/:id', updateFlashcard);
router.delete('/:id', deleteFlashcard);
router.post('/:id/review', reviewFlashcard);

export default router;

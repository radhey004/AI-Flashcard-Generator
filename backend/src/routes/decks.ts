import { Router } from 'express';
import { getDecks, getDeck, createDeck, updateDeck, deleteDeck, getDashboardStats } from '../controllers/deckController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats/dashboard', getDashboardStats);
router.get('/', getDecks);
router.get('/:id', getDeck);
router.post('/', createDeck);
router.put('/:id', updateDeck);
router.delete('/:id', deleteDeck);

export default router;

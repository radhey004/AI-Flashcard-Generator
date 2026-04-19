import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Deck from '../models/Deck';
import Flashcard from '../models/Flashcard';
import { deleteCacheByPrefix } from '../services/cacheService';

export const getDecks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, tag } = req.query;
    const query: Record<string, unknown> = { userId: req.userId };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (tag) query.tags = tag;
    const decks = await Deck.find(query).sort({ updatedAt: -1 });
    const now = new Date();
    const decksWithDue = await Promise.all(decks.map(async (deck) => {
      const dueCount = await Flashcard.countDocuments({
        deckId: deck._id,
        userId: req.userId,
        nextReviewDate: { $lte: now },
      });
      return { ...deck.toObject(), dueCount };
    }));
    res.json({ decks: decksWithDue });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

export const getDeck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deck = await Deck.findOne({ _id: req.params.id, userId: req.userId });
    if (!deck) { res.status(404).json({ message: 'Deck not found' }); return; }
    res.json({ deck });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

export const createDeck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, tags } = req.body;
    if (!name) { res.status(400).json({ message: 'Name is required' }); return; }
    const deck = await Deck.create({ userId: req.userId, name, description: description || '', tags: tags || [] });
    res.status(201).json({ deck });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

export const updateDeck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, tags } = req.body;
    const deck = await Deck.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, description, tags },
      { new: true, runValidators: true }
    );
    if (!deck) { res.status(404).json({ message: 'Deck not found' }); return; }
    deleteCacheByPrefix(`deck:${req.params.id}`);
    res.json({ deck });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

export const deleteDeck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deck = await Deck.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deck) { res.status(404).json({ message: 'Deck not found' }); return; }
    await Flashcard.deleteMany({ deckId: req.params.id, userId: req.userId });
    deleteCacheByPrefix(`deck:${req.params.id}`);
    res.json({ message: 'Deck deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const totalDecks = await Deck.countDocuments({ userId: req.userId });
    const totalCards = await Flashcard.countDocuments({ userId: req.userId });
    const dueCards = await Flashcard.countDocuments({ userId: req.userId, nextReviewDate: { $lte: now } });
    const recentDecks = await Deck.find({ userId: req.userId }).sort({ updatedAt: -1 }).limit(5);

    const recentDecksWithDue = await Promise.all(recentDecks.map(async (deck) => {
      const dueCount = await Flashcard.countDocuments({
        deckId: deck._id, userId: req.userId, nextReviewDate: { $lte: now },
      });
      const cardCount = await Flashcard.countDocuments({ deckId: deck._id, userId: req.userId });
      return { ...deck.toObject(), dueCount, cardCount };
    }));

    res.json({ totalDecks, totalCards, dueCards, recentDecks: recentDecksWithDue });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

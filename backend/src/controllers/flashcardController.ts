import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Flashcard from '../models/Flashcard';
import Deck from '../models/Deck';
import User from '../models/User';
import { calculateSM2, mapRatingToQuality } from '../services/srsService';

export const getFlashcards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deckId, dueOnly, search, tag } = req.query;
    const query: Record<string, unknown> = { userId: req.userId };
    if (deckId) query.deckId = deckId;
    if (dueOnly === 'true') query.nextReviewDate = { $lte: new Date() };
    if (search) query.$or = [
      { question: { $regex: search, $options: 'i' } },
      { answer: { $regex: search, $options: 'i' } },
    ];
    if (tag) query.tags = tag;
    const flashcards = await Flashcard.find(query).sort({ nextReviewDate: 1 });
    res.json({ flashcards });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

export const createFlashcard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deckId, question, answer, difficulty, tags } = req.body;
    if (!deckId || !question || !answer) {
      res.status(400).json({ message: 'deckId, question, and answer are required' });
      return;
    }
    const deck = await Deck.findOne({ _id: deckId, userId: req.userId });
    if (!deck) { res.status(404).json({ message: 'Deck not found' }); return; }

    const flashcard = await Flashcard.create({
      deckId, userId: req.userId, question, answer,
      difficulty: difficulty || 'medium', tags: tags || [],
    });
    await Deck.findByIdAndUpdate(deckId, { $inc: { cardCount: 1 } });
    res.status(201).json({ flashcard });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

export const bulkCreateFlashcards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deckId, flashcards } = req.body;
    if (!deckId || !Array.isArray(flashcards) || flashcards.length === 0) {
      res.status(400).json({ message: 'deckId and flashcards array required' });
      return;
    }
    const deck = await Deck.findOne({ _id: deckId, userId: req.userId });
    if (!deck) { res.status(404).json({ message: 'Deck not found' }); return; }

    const cardsToCreate = flashcards.map((card: { question: string; answer: string; difficulty?: string; tags?: string[] }) => ({
      deckId, userId: req.userId,
      question: card.question, answer: card.answer,
      difficulty: card.difficulty || 'medium', tags: card.tags || [],
    }));
    const created = await Flashcard.insertMany(cardsToCreate);
    await Deck.findByIdAndUpdate(deckId, { $inc: { cardCount: created.length } });
    res.status(201).json({ flashcards: created, count: created.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

export const updateFlashcard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { question, answer, difficulty, tags } = req.body;
    const flashcard = await Flashcard.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { question, answer, difficulty, tags },
      { new: true, runValidators: true }
    );
    if (!flashcard) { res.status(404).json({ message: 'Flashcard not found' }); return; }
    res.json({ flashcard });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

export const deleteFlashcard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const flashcard = await Flashcard.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!flashcard) { res.status(404).json({ message: 'Flashcard not found' }); return; }
    await Deck.findByIdAndUpdate(flashcard.deckId, { $inc: { cardCount: -1 } });
    res.json({ message: 'Flashcard deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

export const reviewFlashcard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rating } = req.body;
    if (!['again', 'hard', 'good', 'easy'].includes(rating)) {
      res.status(400).json({ message: 'Invalid rating. Must be: again, hard, good, or easy' });
      return;
    }
    const flashcard = await Flashcard.findOne({ _id: req.params.id, userId: req.userId });
    if (!flashcard) { res.status(404).json({ message: 'Flashcard not found' }); return; }

    const quality = mapRatingToQuality(rating as 'again' | 'hard' | 'good' | 'easy');
    const srsResult = calculateSM2(quality, flashcard.easeFactor, flashcard.interval, flashcard.repetitions);

    await Flashcard.findByIdAndUpdate(flashcard._id, {
      ...srsResult,
      lastReviewDate: new Date(),
      $inc: { reviewCount: 1 },
    });

    const user = await User.findById(req.userId);
    if (user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastStudy = user.lastStudyDate ? new Date(user.lastStudyDate) : null;
      if (lastStudy) lastStudy.setHours(0, 0, 0, 0);

      let newStreak = user.streak;
      if (!lastStudy || lastStudy.getTime() < today.getTime()) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (!lastStudy || lastStudy.getTime() < yesterday.getTime()) {
          newStreak = 1;
        } else {
          newStreak = user.streak + 1;
        }
      }

      await User.findByIdAndUpdate(req.userId, {
        streak: newStreak,
        lastStudyDate: new Date(),
        $inc: { totalCardsReviewed: 1 },
      });
    }

    res.json({ srsResult, message: 'Review recorded' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

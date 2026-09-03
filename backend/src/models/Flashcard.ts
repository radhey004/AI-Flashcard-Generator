import mongoose, { Document, Schema } from 'mongoose';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface IFlashcard extends Document {
  deckId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  difficulty: Difficulty;
  tags: string[];
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  lastReviewDate: Date | null;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const flashcardSchema = new Schema<IFlashcard>({
  deckId: { type: Schema.Types.ObjectId, ref: 'Deck', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true, trim: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [{ type: String, trim: true }],
  easeFactor: { type: Number, default: 2.5 },
  interval: { type: Number, default: 1 },
  repetitions: { type: Number, default: 0 },
  nextReviewDate: { type: Date, default: Date.now },
  lastReviewDate: { type: Date, default: null },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

flashcardSchema.index({ deckId: 1, userId: 1 });
flashcardSchema.index({ userId: 1, nextReviewDate: 1 });
flashcardSchema.index({ userId: 1, deckId: 1, question: 1 }, { unique: false });
flashcardSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IFlashcard>('Flashcard', flashcardSchema);

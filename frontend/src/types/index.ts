export interface User {
  id: string;
  email: string;
  name: string;
  streak: number;
  totalCardsReviewed?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Flashcard {
  _id: string;
  deckId: string;
  userId: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
  tags: string[];
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate: string | null;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  _id: string;
  userId: string;
  name: string;
  description: string;
  tags: string[];
  cardCount: number;
  dueCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalDecks: number;
  totalCards: number;
  dueCards: number;
  recentDecks: Deck[];
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface GeneratedFlashcard {
  question: string;
  answer: string;
  difficulty: Difficulty;
  tags: string[];
}

export interface AIGenerationResult {
  flashcards: GeneratedFlashcard[];
  topic: string;
  summary: string;
  count: number;
}

export type InputType = 'text' | 'pdf' | 'youtube';

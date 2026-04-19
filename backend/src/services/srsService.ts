export interface SRSResult {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export function calculateSM2(
  quality: ReviewQuality,
  easeFactor: number,
  interval: number,
  repetitions: number
): SRSResult {
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality >= 3) {
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(newInterval * newEaseFactor);
    }
    newRepetitions += 1;
    newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEaseFactor < 1.3) newEaseFactor = 1.3;
  } else {
    newRepetitions = 0;
    newInterval = 1;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
  };
}

export function mapRatingToQuality(rating: 'again' | 'hard' | 'good' | 'easy'): ReviewQuality {
  const map: Record<string, ReviewQuality> = {
    again: 0,
    hard: 2,
    good: 4,
    easy: 5,
  };
  return map[rating] as ReviewQuality;
}

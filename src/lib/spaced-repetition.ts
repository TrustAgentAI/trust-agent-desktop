/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Implementation of the SuperMemo SM-2 algorithm for optimal review scheduling.
 * Key concepts from sessions are flagged for review and scheduled using
 * scientifically-proven interval calculations.
 *
 * Rating scale:
 *   0 (Again)  - Complete blackout, no recall
 *   3 (Hard)   - Recalled with significant difficulty
 *   4 (Good)   - Recalled with some hesitation
 *   5 (Easy)   - Perfect recall, no hesitation
 */

export interface SpacedRepItem {
  id: string;
  roleId: string;
  question: string;
  answer: string;
  /** Easiness factor - starts at 2.5, min 1.3 */
  easinessFactor: number;
  /** Current interval in days */
  interval: number;
  /** Number of consecutive correct responses */
  repetitions: number;
  /** ISO timestamp of next scheduled review */
  nextReview: string;
  /** ISO timestamp of when this item was created */
  createdAt: string;
  /** ISO timestamp of last review */
  lastReviewed: string | null;
  /** Total number of reviews performed */
  totalReviews: number;
  /** Number of times rated "Again" (0) */
  lapses: number;
  /** Topic or category tag for grouping */
  topic?: string;
}

export type Rating = 0 | 3 | 4 | 5;

export interface SM2Result {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
}

export interface RepStats {
  total: number;
  due: number;
  mastered: number;
  learning: number;
  new: number;
  averageEasiness: number;
  totalReviews: number;
  retentionRate: number;
}

/**
 * Core SM-2 calculation.
 * Given the current item state and a user rating, returns the new scheduling values.
 */
export function calculateSM2(
  rating: Rating,
  currentEF: number,
  currentInterval: number,
  currentRepetitions: number
): SM2Result {
  let newEF = currentEF;
  let newInterval: number;
  let newRepetitions: number;

  if (rating < 3) {
    // Failed recall - reset repetitions, keep EF, short interval
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Successful recall
    newRepetitions = currentRepetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * currentEF);
    }
  }

  // Update easiness factor using SM-2 formula
  newEF = currentEF + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));

  // EF must never go below 1.3
  if (newEF < 1.3) newEF = 1.3;

  // Cap interval at 365 days
  if (newInterval > 365) newInterval = 365;

  const now = new Date();
  const nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return {
    easinessFactor: Math.round(newEF * 100) / 100,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview: nextReviewDate.toISOString(),
  };
}

/**
 * Create a new spaced repetition item with default SM-2 values.
 */
export function createSpacedRepItem(
  roleId: string,
  question: string,
  answer: string,
  topic?: string
): SpacedRepItem {
  return {
    id: `sr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    roleId,
    question,
    answer,
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    lastReviewed: null,
    totalReviews: 0,
    lapses: 0,
    topic,
  };
}

/**
 * Apply a rating to an item and return the updated item.
 */
export function reviewItem(item: SpacedRepItem, rating: Rating): SpacedRepItem {
  const result = calculateSM2(
    rating,
    item.easinessFactor,
    item.interval,
    item.repetitions
  );

  return {
    ...item,
    easinessFactor: result.easinessFactor,
    interval: result.interval,
    repetitions: result.repetitions,
    nextReview: result.nextReview,
    lastReviewed: new Date().toISOString(),
    totalReviews: item.totalReviews + 1,
    lapses: rating < 3 ? item.lapses + 1 : item.lapses,
  };
}

/**
 * Check if an item is due for review (nextReview <= now).
 */
export function isDue(item: SpacedRepItem): boolean {
  return new Date(item.nextReview) <= new Date();
}

/**
 * Filter items to only those that are due for review.
 */
export function getDueItems(items: SpacedRepItem[]): SpacedRepItem[] {
  return items.filter(isDue).sort(
    (a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime()
  );
}

/**
 * Calculate statistics for a set of items.
 */
export function getItemStats(items: SpacedRepItem[]): RepStats {
  if (items.length === 0) {
    return {
      total: 0,
      due: 0,
      mastered: 0,
      learning: 0,
      new: 0,
      averageEasiness: 2.5,
      totalReviews: 0,
      retentionRate: 0,
    };
  }

  const due = items.filter(isDue).length;
  // Mastered: EF >= 2.5 and interval >= 21 days
  const mastered = items.filter((i) => i.easinessFactor >= 2.5 && i.interval >= 21).length;
  // New: never reviewed
  const newItems = items.filter((i) => i.totalReviews === 0).length;
  // Learning: reviewed but not mastered
  const learning = items.length - mastered - newItems;

  const totalReviews = items.reduce((sum, i) => sum + i.totalReviews, 0);
  const totalLapses = items.reduce((sum, i) => sum + i.lapses, 0);
  const retentionRate =
    totalReviews > 0 ? Math.round(((totalReviews - totalLapses) / totalReviews) * 100) : 0;

  const averageEasiness =
    Math.round(
      (items.reduce((sum, i) => sum + i.easinessFactor, 0) / items.length) * 100
    ) / 100;

  return {
    total: items.length,
    due,
    mastered,
    learning,
    new: newItems,
    averageEasiness,
    totalReviews,
    retentionRate,
  };
}

/**
 * Get human-readable label for a rating value.
 */
export function getRatingLabel(rating: Rating): string {
  switch (rating) {
    case 0:
      return 'Again';
    case 3:
      return 'Hard';
    case 4:
      return 'Good';
    case 5:
      return 'Easy';
  }
}

/**
 * Get the estimated next interval in a human-readable format.
 */
export function getNextIntervalPreview(
  rating: Rating,
  currentEF: number,
  currentInterval: number,
  currentRepetitions: number
): string {
  const result = calculateSM2(rating, currentEF, currentInterval, currentRepetitions);
  const days = result.interval;
  if (days < 1) return '<1 day';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return '1 year';
}

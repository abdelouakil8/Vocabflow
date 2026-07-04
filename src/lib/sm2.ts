/**
 * SM-2 (SuperMemo 2) spaced-repetition algorithm — the same family Anki is based on.
 *
 * Verified against the canonical Woźniak publication (super-memory.com/english/ol/sm2.htm).
 * EF is updated only on correct answers (q >= 3); on a lapse the schedule resets but
 * the E-Factor is left unchanged, per the canonical "without changing the E-Factor" rule.
 */
import type { ReviewButtonValue } from '../schemas/word'

export type Sm2Grade = 0 | 1 | 2 | 3 | 4 | 5

export interface Sm2State {
  /** E-Factor, >= 1.3 (default 2.5). */
  easeFactor: number
  /** Interval in days (default 0). */
  intervalDays: number
  /** Consecutive correct count, n (default 0). */
  repetitions: number
  /** Failure counter (non-canonical add-on, default 0). */
  lapses: number
}

export interface Sm2Result {
  easeFactor: number
  intervalDays: number
  repetitions: number
  dueDate: Date
  lapses: number
}

const MIN_EASE_FACTOR = 1.3
const MAX_INTERVAL_DAYS = 90
const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Recommended 4-button → SM-2 quality mapping. */
export function buttonToQuality(button: ReviewButtonValue): Sm2Grade {
  switch (button) {
    case 'again':
      return 2 // q < 3 → lapse branch
    case 'hard':
      return 3
    case 'good':
      return 4
    case 'easy':
      return 5
  }
}

/**
 * Pure SM-2 update. `dueDate = now + intervalDays`.
 *
 * @param state   current scheduling state of the card
 * @param quality recall quality this review, 0..5
 * @param now     the review moment (defaults to current time)
 */
export function sm2(
  state: Sm2State,
  quality: Sm2Grade,
  now: Date = new Date(),
): Sm2Result {
  const { easeFactor, intervalDays, repetitions, lapses } = state

  let nextEase = easeFactor
  let nextInterval: number
  let nextReps: number
  let nextLapses = lapses

  if (quality < 3) {
    // Lapse: reset the schedule, keep EF unchanged.
    nextReps = 0
    nextInterval = 1
    nextLapses = lapses + 1
  } else {
    // Correct: advance repetitions and interval, then update EF.
    nextReps = repetitions + 1
    if (nextReps === 1) {
      nextInterval = 1
    } else if (nextReps === 2) {
      nextInterval = 6
    } else {
      // Uses the EF value from *before* this review's update.
      nextInterval = Math.min(
        Math.round(intervalDays * easeFactor),
        MAX_INTERVAL_DAYS,
      )
    }

    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)), floored at 1.3.
    const q = quality
    nextEase = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if (nextEase < MIN_EASE_FACTOR) nextEase = MIN_EASE_FACTOR
  }

  const dueDate = new Date(now.getTime() + nextInterval * MS_PER_DAY)

  return {
    easeFactor: nextEase,
    intervalDays: nextInterval,
    repetitions: nextReps,
    dueDate,
    lapses: nextLapses,
  }
}

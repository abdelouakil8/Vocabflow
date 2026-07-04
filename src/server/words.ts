import { createServerFn } from '@tanstack/react-start'
import { asc, desc, eq, isNull, lt, lte, or, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { reviewLogs, wordProgress, words } from '../db/schema'
import { MATURE_INTERVAL_DAYS, computeStreaks, deriveStatus } from '../lib/stats'
import type {
  DashboardStats,
  ReviewCard,
  WordListItem,
} from '../schemas/word'

/**
 * All cards that need the user's attention, in priority order:
 *   1. Due cards (dueDate <= now) — SM-2 scheduled reviews
 *   2. New cards (never reviewed) — waiting to be learned
 *   3. Non-mastered cards not yet due — available for extra study
 * Mastered cards only appear when their dueDate <= now (periodic re-check).
 *
 * Within each group, weakest cards come first:
 *   lapses DESC → easeFactor ASC → intervalDays ASC → dueDate ASC
 */
export const getDueCards = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<ReviewCard>> => {
    const db = getDb()
    const now = new Date()

    const rows = await db
      .select({
        progressId: wordProgress.id,
        wordId: words.id,
        frenchText: words.frenchText,
        type: words.type,
        arabicMeaning: words.arabicMeaning,
        exampleSentence: words.exampleSentence,
        dueDate: wordProgress.dueDate,
        intervalDays: wordProgress.intervalDays,
        lapses: wordProgress.lapses,
        easeFactor: wordProgress.easeFactor,
        lastReviewedAt: wordProgress.lastReviewedAt,
      })
      .from(wordProgress)
      .innerJoin(words, eq(words.id, wordProgress.wordId))
      .where(
        or(
          lte(wordProgress.dueDate, now), // due (includes mastered-but-due)
          lt(wordProgress.intervalDays, MATURE_INTERVAL_DAYS), // non-mastered
          isNull(wordProgress.lastReviewedAt), // never reviewed
        ),
      )
      .orderBy(
        // Due cards first, then the rest
        sql`CASE WHEN ${wordProgress.dueDate} <= ${now} THEN 0 ELSE 1 END`,
        // Within each group: weakest first
        desc(wordProgress.lapses),
        asc(wordProgress.easeFactor),
        asc(wordProgress.intervalDays),
        asc(wordProgress.dueDate),
      )
      .limit(10) // <-- Batch to max 10 cards per session for better absorption

    return rows.map((r) => ({
      progressId: r.progressId,
      wordId: r.wordId,
      frenchText: r.frenchText,
      type: r.type,
      arabicMeaning: r.arabicMeaning,
      exampleSentence: r.exampleSentence,
    }))
  },
)

/** Full glossary with SM-2 status, ordered alphabetically by French text. */
export const getWordList = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<WordListItem>> => {
    const db = getDb()

    const rows = await db
      .select({
        id: words.id,
        frenchText: words.frenchText,
        type: words.type,
        arabicMeaning: words.arabicMeaning,
        exampleSentence: words.exampleSentence,
        repetitions: wordProgress.repetitions,
        intervalDays: wordProgress.intervalDays,
        dueDate: wordProgress.dueDate,
        lastReviewedAt: wordProgress.lastReviewedAt,
      })
      .from(words)
      .innerJoin(wordProgress, eq(wordProgress.wordId, words.id))
      .orderBy(asc(words.frenchText))

    return rows.map((r) => ({
      id: r.id,
      frenchText: r.frenchText,
      type: r.type,
      arabicMeaning: r.arabicMeaning,
      exampleSentence: r.exampleSentence,
      status: deriveStatus(r.intervalDays, r.lastReviewedAt),
      repetitions: r.repetitions,
      intervalDays: r.intervalDays,
      dueDate: r.dueDate.toISOString(),
      lastReviewedAt: r.lastReviewedAt ? r.lastReviewedAt.toISOString() : null,
    }))
  },
)

/** Aggregate counts + streak for the dashboard. */
export const getDashboardStats = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DashboardStats> => {
    const db = getDb()
    const now = new Date()

    const progressRows = await db
      .select({
        intervalDays: wordProgress.intervalDays,
        lastReviewedAt: wordProgress.lastReviewedAt,
        dueDate: wordProgress.dueDate,
      })
      .from(wordProgress)

    const logs = await db
      .select({ reviewedAt: reviewLogs.reviewedAt })
      .from(reviewLogs)

    const total = progressRows.length
    let due = 0
    let newCount = 0
    let beginner = 0
    let familiar = 0
    let confident = 0
    let mastered = 0

    for (const r of progressRows) {
      if (r.dueDate <= now) due += 1
      const status = deriveStatus(r.intervalDays, r.lastReviewedAt)
      switch (status) {
        case 'new':
          newCount += 1
          break
        case 'beginner':
          beginner += 1
          break
        case 'familiar':
          familiar += 1
          break
        case 'confident':
          confident += 1
          break
        case 'mastered':
          mastered += 1
          break
      }
    }

    // Reviewable = all non-mastered + mastered-but-due
    const reviewable = newCount + beginner + familiar + confident +
      progressRows.filter(
        (r) =>
          r.intervalDays >= MATURE_INTERVAL_DAYS && r.dueDate <= now,
      ).length

    const { current, longest } = computeStreaks(logs.map((l) => l.reviewedAt))

    return {
      total,
      due,
      reviewable,
      newCount,
      beginner,
      familiar,
      confident,
      mastered,
      currentStreak: current,
      longestStreak: longest,
    }
  },
)

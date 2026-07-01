import { createServerFn } from '@tanstack/react-start'
import { asc, eq, lte } from 'drizzle-orm'
import { getDb } from '../db'
import { reviewLogs, wordProgress, words } from '../db/schema'
import { computeStreaks, deriveStatus } from '../lib/stats'
import type {
  DashboardStats,
  ReviewCard,
  WordListItem,
} from '../schemas/word'

/** Cards due now (dueDate <= now), ordered by priority: soonest due, then hardest. */
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
      })
      .from(wordProgress)
      .innerJoin(words, eq(words.id, wordProgress.wordId))
      .where(lte(wordProgress.dueDate, now))
      .orderBy(
        asc(wordProgress.dueDate),
        asc(wordProgress.easeFactor),
        asc(words.id),
      )

    return rows
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
    let learning = 0
    let mastered = 0

    for (const r of progressRows) {
      if (r.dueDate <= now) due += 1
      const status = deriveStatus(r.intervalDays, r.lastReviewedAt)
      if (status === 'new') newCount += 1
      else if (status === 'learning') learning += 1
      else mastered += 1
    }

    const { current, longest } = computeStreaks(logs.map((l) => l.reviewedAt))

    return {
      total,
      due,
      newCount,
      learning,
      mastered,
      currentStreak: current,
      longestStreak: longest,
    }
  },
)

import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import type { Database } from '../db'
import { reviewLogs, wordProgress } from '../db/schema'
import { buttonToQuality, sm2 } from '../lib/sm2'
import { deriveStatus } from '../lib/stats'
import { submitReviewSchema } from '../schemas/word'
import type { SubmitReviewInput, SubmitReviewResult } from '../schemas/word'

/**
 * Apply one review answer: run SM-2, persist the new schedule, and append a log.
 * The schedule update + log insert run as a single batched round-trip.
 *
 * Pure business logic (takes `db` + `now`) so it can be tested directly.
 */
export async function applyReview(
  db: Database,
  input: SubmitReviewInput,
  now: Date,
): Promise<SubmitReviewResult> {
  const quality = buttonToQuality(input.button)

  const current = await db
    .select()
    .from(wordProgress)
    .where(eq(wordProgress.id, input.progressId))
    .limit(1)

  const progress = current[0]
  if (!progress) {
    throw new Error(`Progress ${input.progressId} not found`)
  }

  const next = sm2(
    {
      easeFactor: progress.easeFactor,
      intervalDays: progress.intervalDays,
      repetitions: progress.repetitions,
      lapses: progress.lapses,
    },
    quality,
    now,
  )

  await db.batch([
    db
      .update(wordProgress)
      .set({
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        lapses: next.lapses,
        dueDate: next.dueDate,
        lastReviewedAt: now,
      })
      .where(eq(wordProgress.id, input.progressId)),
    db.insert(reviewLogs).values({
      wordProgressId: input.progressId,
      quality,
      responseTimeMs: input.responseTimeMs ?? null,
    }),
  ])

  return {
    progressId: input.progressId,
    intervalDays: next.intervalDays,
    dueDate: next.dueDate.toISOString(),
    status: deriveStatus(next.intervalDays, now),
  }
}

export const submitReview = createServerFn({ method: 'POST' })
  .validator(submitReviewSchema)
  .handler(({ data }) => applyReview(getDb(), data, new Date()))

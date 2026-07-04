import { z } from 'zod'

/** SM-2 review buttons exposed by the UI. */
export const reviewButtonSchema = z.enum(['again', 'hard', 'good', 'easy'])
export type ReviewButtonValue = z.infer<typeof reviewButtonSchema>

/** Input for submitting one review answer. */
export const submitReviewSchema = z.object({
  progressId: z.number().int().positive(),
  button: reviewButtonSchema,
  responseTimeMs: z.number().int().nonnegative().max(3_600_000).optional(),
})
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>

/** Learning status derived from SM-2 state (5 levels). */
export type WordStatus = 'new' | 'beginner' | 'familiar' | 'confident' | 'mastered'

/** A single card shown during a review session. */
export interface ReviewCard {
  progressId: number
  wordId: number
  frenchText: string
  type: string | null
  arabicMeaning: string
  exampleSentence: string | null
}

/** A row in the glossary / words list. Dates are ISO strings (JSON-safe). */
export interface WordListItem {
  id: number
  frenchText: string
  type: string | null
  arabicMeaning: string
  exampleSentence: string | null
  status: WordStatus
  repetitions: number
  intervalDays: number
  dueDate: string
  lastReviewedAt: string | null
}

/** Dashboard aggregate stats. */
export interface DashboardStats {
  total: number
  due: number
  reviewable: number
  newCount: number
  beginner: number
  familiar: number
  confident: number
  mastered: number
  currentStreak: number
  longestStreak: number
}

/** Result of a sheet sync run. */
export interface SyncResult {
  inserted: number
  skipped: number
  totalRows: number
}

/** Outcome of submitting one review (drives the optimistic UI). */
export interface SubmitReviewResult {
  progressId: number
  intervalDays: number
  dueDate: string
  status: WordStatus
}

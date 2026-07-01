import { relations } from 'drizzle-orm'
import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'

/**
 * Vocabulary entries, mirrored from the Google Sheet.
 * `frenchText` is unique to prevent duplicate words (exact match, trimmed).
 */
export const words = pgTable('words', {
  id: serial('id').primaryKey(),
  frenchText: text('french_text').notNull().unique(),
  type: text('type'), // nullable — sheet column B is often empty
  arabicMeaning: text('arabic_meaning').notNull(),
  exampleSentence: text('example_sentence'), // nullable — sheet column D
  sourceRow: integer('source_row'), // 1-based row index in the sheet, nullable
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
})

/**
 * SM-2 scheduling state, one row per word (1-to-1 via the unique `wordId`).
 */
export const wordProgress = pgTable(
  'word_progress',
  {
    id: serial('id').primaryKey(),
    wordId: integer('word_id')
      .notNull()
      .unique()
      .references(() => words.id, { onDelete: 'cascade' }),
    easeFactor: doublePrecision('ease_factor').notNull().default(2.5),
    intervalDays: integer('interval_days').notNull().default(0),
    repetitions: integer('repetitions').notNull().default(0),
    lapses: integer('lapses').notNull().default(0),
    dueDate: timestamp('due_date', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    lastReviewedAt: timestamp('last_reviewed_at', {
      withTimezone: true,
      mode: 'date',
    }), // nullable — never reviewed yet
  },
  (table) => [index('idx_word_progress_due_date').on(table.dueDate)],
)

/**
 * Append-only log of every review answer (for streak/stats and history).
 */
export const reviewLogs = pgTable(
  'review_logs',
  {
    id: serial('id').primaryKey(),
    wordProgressId: integer('word_progress_id')
      .notNull()
      .references(() => wordProgress.id, { onDelete: 'cascade' }),
    quality: integer('quality').notNull(), // SM-2 grade 0..5
    responseTimeMs: integer('response_time_ms'), // nullable
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('idx_review_logs_reviewed_at').on(table.reviewedAt)],
)

export const wordsRelations = relations(words, ({ one }) => ({
  progress: one(wordProgress, {
    fields: [words.id],
    references: [wordProgress.wordId],
  }),
}))

export const wordProgressRelations = relations(
  wordProgress,
  ({ one, many }) => ({
    word: one(words, {
      fields: [wordProgress.wordId],
      references: [words.id],
    }),
    logs: many(reviewLogs),
  }),
)

export const reviewLogsRelations = relations(reviewLogs, ({ one }) => ({
  progress: one(wordProgress, {
    fields: [reviewLogs.wordProgressId],
    references: [wordProgress.id],
  }),
}))

export type Word = typeof words.$inferSelect
export type NewWord = typeof words.$inferInsert
export type WordProgress = typeof wordProgress.$inferSelect
export type NewWordProgress = typeof wordProgress.$inferInsert
export type ReviewLog = typeof reviewLogs.$inferSelect
export type NewReviewLog = typeof reviewLogs.$inferInsert

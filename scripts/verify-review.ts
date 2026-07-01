import 'dotenv/config'
import { asc, eq, lte } from 'drizzle-orm'
import { getDb } from '../src/db'
import { reviewLogs, wordProgress, words } from '../src/db/schema'
import { applyReview } from '../src/server/review'

const db = getDb()
const now = new Date()

// Pick the first due card (same ordering the review screen uses).
const due = await db
  .select({
    progressId: wordProgress.id,
    french: words.frenchText,
    repetitions: wordProgress.repetitions,
    intervalDays: wordProgress.intervalDays,
  })
  .from(wordProgress)
  .innerJoin(words, eq(words.id, wordProgress.wordId))
  .where(lte(wordProgress.dueDate, now))
  .orderBy(asc(wordProgress.dueDate), asc(wordProgress.easeFactor), asc(words.id))
  .limit(1)

const card = due[0]
if (!card) {
  console.log('no due card to test')
  process.exit(1)
}
console.log('testing review on:', card.french, '(progressId', card.progressId + ')')
console.log('before:', {
  repetitions: card.repetitions,
  intervalDays: card.intervalDays,
})

// Snapshot state to restore afterwards (keep the app clean for the user).
const before = (
  await db.select().from(wordProgress).where(eq(wordProgress.id, card.progressId))
)[0]!

const result = await applyReview(
  db,
  { progressId: card.progressId, button: 'good', responseTimeMs: 1234 },
  now,
)
console.log('applyReview result:', result)

// Re-read persisted state.
const after = (
  await db.select().from(wordProgress).where(eq(wordProgress.id, card.progressId))
)[0]!
const log = (
  await db
    .select()
    .from(reviewLogs)
    .where(eq(reviewLogs.wordProgressId, card.progressId))
)[0]

const expectedDue = new Date(now.getTime() + 1 * 86_400_000)
const checks: Array<[string, boolean]> = [
  ['repetitions == 1', after.repetitions === 1],
  ['intervalDays == 1', after.intervalDays === 1],
  ['easeFactor == 2.5 (q=4 unchanged)', Math.abs(after.easeFactor - 2.5) < 1e-9],
  ['lastReviewedAt set', after.lastReviewedAt !== null],
  [
    'dueDate ~ now+1d',
    Math.abs(after.dueDate.getTime() - expectedDue.getTime()) < 2000,
  ],
  ['review_log inserted', !!log],
  ['log quality == 4', log?.quality === 4],
  ['log responseTimeMs == 1234', log?.responseTimeMs === 1234],
  ['status == learning', result.status === 'learning'],
]

let failures = 0
for (const [name, ok] of checks) {
  console.log(ok ? `pass ${name}` : `FAIL ${name}`)
  if (!ok) failures += 1
}

// Restore original state so the user starts with a clean 179-due deck.
await db.batch([
  db
    .update(wordProgress)
    .set({
      easeFactor: before.easeFactor,
      intervalDays: before.intervalDays,
      repetitions: before.repetitions,
      lapses: before.lapses,
      dueDate: before.dueDate,
      lastReviewedAt: before.lastReviewedAt,
    })
    .where(eq(wordProgress.id, card.progressId)),
  db.delete(reviewLogs).where(eq(reviewLogs.wordProgressId, card.progressId)),
])
console.log('\n(state restored to clean deck)')
console.log(failures === 0 ? 'ALL REVIEW-WRITE TESTS PASSED' : `${failures} FAILURES`)
if (failures > 0) process.exitCode = 1

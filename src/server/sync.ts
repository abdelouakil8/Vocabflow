import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../db'
import { words, wordProgress } from '../db/schema'
import { getServerEnv } from '../lib/env'
import { fetchSheetRows } from '../lib/sheet'
import type { SyncResult } from '../schemas/word'

/**
 * Pull the Google Sheet, insert only new words (exact-match dedup on frenchText),
 * and auto-create an initial word_progress row for each so they enter the review
 * queue immediately (dueDate = now). Two bulk statements regardless of row count.
 */
export const syncFromSheet = createServerFn({ method: 'POST' }).handler(
  async (): Promise<SyncResult> => {
    const env = getServerEnv()
    const db = getDb()

    const sheetRows = await fetchSheetRows(
      env.GOOGLE_SHEET_ID,
      env.GOOGLE_SHEET_GID,
    )

    const existing = await db
      .select({ frenchText: words.frenchText })
      .from(words)
    const existingSet = new Set(existing.map((r) => r.frenchText))

    // Dedup against the DB and within the incoming batch.
    const seen = new Set<string>()
    const toInsert = sheetRows.filter((row) => {
      if (existingSet.has(row.frenchText) || seen.has(row.frenchText)) {
        return false
      }
      seen.add(row.frenchText)
      return true
    })

    if (toInsert.length === 0) {
      return { inserted: 0, skipped: sheetRows.length, totalRows: sheetRows.length }
    }

    const insertedWords = await db
      .insert(words)
      .values(
        toInsert.map((row) => ({
          frenchText: row.frenchText,
          type: row.type,
          arabicMeaning: row.arabicMeaning,
          exampleSentence: row.exampleSentence,
          sourceRow: row.sourceRow,
        })),
      )
      .onConflictDoNothing({ target: words.frenchText })
      .returning({ id: words.id })

    if (insertedWords.length > 0) {
      await db
        .insert(wordProgress)
        .values(insertedWords.map((w) => ({ wordId: w.id })))
    }

    const inserted = insertedWords.length
    return {
      inserted,
      skipped: sheetRows.length - inserted,
      totalRows: sheetRows.length,
    }
  },
)

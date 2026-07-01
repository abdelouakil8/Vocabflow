import type { WordStatus } from '../schemas/word'

/** A card is "mastered" (mature) once its interval reaches this many days. */
export const MATURE_INTERVAL_DAYS = 21

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Derive learning status from SM-2 state.
 * - never reviewed → 'new'
 * - interval >= 21 days → 'mastered'
 * - otherwise → 'learning' (includes relearning after a lapse)
 */
export function deriveStatus(
  intervalDays: number,
  lastReviewedAt: Date | null,
): WordStatus {
  if (lastReviewedAt === null) return 'new'
  if (intervalDays >= MATURE_INTERVAL_DAYS) return 'mastered'
  return 'learning'
}

/** UTC calendar-day key (YYYY-MM-DD). */
function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function isConsecutive(prevKey: string, curKey: string): boolean {
  const prev = new Date(`${prevKey}T00:00:00Z`).getTime()
  const cur = new Date(`${curKey}T00:00:00Z`).getTime()
  return cur - prev === MS_PER_DAY
}

/**
 * Longest and current run of consecutive calendar days (UTC) with at least one review.
 * Current streak counts only if the latest review day is today or yesterday.
 */
export function computeStreaks(reviewDates: Array<Date>): {
  current: number
  longest: number
} {
  if (reviewDates.length === 0) return { current: 0, longest: 0 }

  const days = Array.from(new Set(reviewDates.map(dayKey))).sort()

  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1] ?? ''
    const cur = days[i] ?? ''
    run = isConsecutive(prev, cur) ? run + 1 : 1
    if (run > longest) longest = run
  }

  const todayKey = dayKey(new Date())
  const yesterdayKey = dayKey(new Date(Date.now() - MS_PER_DAY))
  const last = days[days.length - 1] ?? ''

  let current = 0
  if (last === todayKey || last === yesterdayKey) {
    current = 1
    for (let i = days.length - 1; i > 0; i--) {
      const prev = days[i - 1] ?? ''
      const cur = days[i] ?? ''
      if (isConsecutive(prev, cur)) current += 1
      else break
    }
  }

  return { current, longest }
}

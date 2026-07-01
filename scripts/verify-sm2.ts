import { buttonToQuality, sm2 } from '../src/lib/sm2'
import type { Sm2Grade, Sm2State } from '../src/lib/sm2'

let failures = 0
const now = new Date('2026-06-30T12:00:00.000Z')

function approx(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-9
}

function check(
  name: string,
  state: Sm2State,
  q: Sm2Grade,
  expected: {
    easeFactor: number
    intervalDays: number
    repetitions: number
    lapses: number
  },
): void {
  const r = sm2(state, q, now)
  const ok =
    approx(r.easeFactor, expected.easeFactor) &&
    r.intervalDays === expected.intervalDays &&
    r.repetitions === expected.repetitions &&
    r.lapses === expected.lapses &&
    r.dueDate.getTime() ===
      now.getTime() + expected.intervalDays * 86_400_000
  if (!ok) {
    failures += 1
    console.log(`FAIL ${name}`)
    console.log('  expected', expected)
    console.log('  got     ', {
      easeFactor: r.easeFactor,
      intervalDays: r.intervalDays,
      repetitions: r.repetitions,
      lapses: r.lapses,
    })
  } else {
    console.log(`pass ${name}`)
  }
}

const fresh: Sm2State = {
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
  lapses: 0,
}

// First three correct "good" answers walk the canonical 1 → 6 → round(I*EF) schedule.
check('good #1 (new)', fresh, 4, {
  easeFactor: 2.5,
  intervalDays: 1,
  repetitions: 1,
  lapses: 0,
})
check(
  'good #2',
  { easeFactor: 2.5, intervalDays: 1, repetitions: 1, lapses: 0 },
  4,
  { easeFactor: 2.5, intervalDays: 6, repetitions: 2, lapses: 0 },
)
check(
  'good #3 (round 6*2.5=15)',
  { easeFactor: 2.5, intervalDays: 6, repetitions: 2, lapses: 0 },
  4,
  { easeFactor: 2.5, intervalDays: 15, repetitions: 3, lapses: 0 },
)

// EF deltas: q=5 → +0.10, q=3 → -0.14.
check('easy (q5 → EF 2.6)', fresh, 5, {
  easeFactor: 2.6,
  intervalDays: 1,
  repetitions: 1,
  lapses: 0,
})
check('hard (q3 → EF 2.36)', fresh, 3, {
  easeFactor: 2.36,
  intervalDays: 1,
  repetitions: 1,
  lapses: 0,
})

// Lapse: reset reps/interval, +1 lapse, EF unchanged.
check(
  'again/lapse keeps EF, resets schedule',
  { easeFactor: 2.5, intervalDays: 10, repetitions: 5, lapses: 0 },
  2,
  { easeFactor: 2.5, intervalDays: 1, repetitions: 0, lapses: 1 },
)

// EF floor at 1.3.
check(
  'EF floored at 1.3',
  { easeFactor: 1.3, intervalDays: 20, repetitions: 4, lapses: 0 },
  3,
  { easeFactor: 1.3, intervalDays: 26, repetitions: 5, lapses: 0 },
)

// Button → quality mapping.
const mapping: Record<string, number> = {
  again: buttonToQuality('again'),
  hard: buttonToQuality('hard'),
  good: buttonToQuality('good'),
  easy: buttonToQuality('easy'),
}
const expectedMap = { again: 2, hard: 3, good: 4, easy: 5 }
if (JSON.stringify(mapping) !== JSON.stringify(expectedMap)) {
  failures += 1
  console.log('FAIL button mapping', mapping)
} else {
  console.log('pass button mapping', mapping)
}

console.log(failures === 0 ? '\nALL SM-2 TESTS PASSED' : `\n${failures} FAILURES`)
if (failures > 0) process.exitCode = 1

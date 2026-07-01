import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Check, PartyPopper, RotateCcw } from 'lucide-react'
import { getDueCards } from '../server/words'
import { submitReview } from '../server/review'
import { Flashcard } from '../components/Flashcard'
import type { ReviewButtonValue } from '../schemas/word'

export const Route = createFileRoute('/review')({
  loader: () => getDueCards(),
  component: ReviewSession,
  pendingComponent: ReviewPending,
})

interface RatingButton {
  value: ReviewButtonValue
  label: string
  hint: string
  className: string
  icon: ReactNode
}

const RATING_BUTTONS: Array<RatingButton> = [
  {
    value: 'again',
    label: 'كرّر',
    hint: '1',
    className: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',
    icon: <RotateCcw size={20} />,
  },
  {
    value: 'hard',
    label: 'صعب',
    hint: '2',
    className: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100',
    icon: <span className="text-lg font-bold leading-none">~</span>,
  },
  {
    value: 'good',
    label: 'جيد',
    hint: '3',
    className: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
    icon: <Check size={20} />,
  },
  {
    value: 'easy',
    label: 'سهل',
    hint: '4',
    className: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
    icon: <Check size={20} className="stroke-[3]" />,
  },
]

function ReviewSession() {
  const deck = Route.useLoaderData()
  const router = useRouter()

  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const shownAtRef = useRef<number>(Date.now())

  const card = deck[index]

  const goToDashboard = useCallback(() => {
    void router.navigate({ to: '/' })
  }, [router])

  const handleRate = useCallback(
    (button: ReviewButtonValue) => {
      if (!card) return
      const responseTimeMs = Math.min(
        Date.now() - shownAtRef.current,
        3_600_000,
      )

      // Fire-and-forget: never block the next card on the network.
      void submitReview({
        data: { progressId: card.progressId, button, responseTimeMs },
      }).catch(() => {
        // The schedule write failed; the card simply stays due next time.
      })

      setIsFlipped(false)
      const next = index + 1
      if (next >= deck.length) {
        setDone(true)
      } else {
        setIndex(next)
        shownAtRef.current = Date.now()
      }
    },
    [card, deck.length, index],
  )

  // Keyboard: Space/Enter flips; 1-4 rate once flipped.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || !card) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setIsFlipped((f) => !f)
        return
      }
      if (!isFlipped) return
      const map: Record<string, ReviewButtonValue> = {
        '1': 'again',
        '2': 'hard',
        '3': 'good',
        '4': 'easy',
      }
      const button = map[e.key]
      if (button) {
        e.preventDefault()
        handleRate(button)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFlipped, done, card, handleRate])

  if (deck.length === 0) {
    return (
      <CenteredMessage
        icon={<PartyPopper size={32} />}
        title="لا كلمات مستحقة الآن"
        subtitle="أنجزت كل المراجعات المستحقة. عُد لاحقًا!"
        onBack={goToDashboard}
      />
    )
  }

  if (done || !card) {
    return (
      <CenteredMessage
        icon={<PartyPopper size={32} />}
        title="أحسنت! انتهت الجلسة"
        subtitle={`راجعت ${deck.length} بطاقة.`}
        onBack={goToDashboard}
      />
    )
  }

  const progress = (index / deck.length) * 100

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-57px)] max-w-2xl flex-col px-4 py-4">
      {/* Top bar */}
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={goToDashboard}
          className="text-slate-400 transition-colors hover:text-slate-700"
          aria-label="رجوع"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-indigo-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium tabular-nums text-slate-500">
          {index + 1} / {deck.length}
        </span>
      </div>

      {/* Card */}
      <div className="flex flex-1 flex-col justify-center">
        <Flashcard
          key={card.progressId}
          card={card}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped((f) => !f)}
        />
      </div>

      {/* Rating buttons */}
      <div
        className={`mt-6 grid grid-cols-4 gap-2 transition-opacity duration-200 ${
          isFlipped
            ? 'opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isFlipped}
      >
        {RATING_BUTTONS.map((b) => (
          <button
            key={b.value}
            type="button"
            onClick={() => handleRate(b.value)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-3 transition-colors ${b.className}`}
          >
            {b.icon}
            <span className="text-xs font-bold">{b.label}</span>
          </button>
        ))}
      </div>
      {!isFlipped ? (
        <p className="mt-6 text-center text-sm text-slate-400">
          اضغط البطاقة لإظهار الإجابة
        </p>
      ) : null}
    </main>
  )
}

function CenteredMessage({
  icon,
  title,
  subtitle,
  onBack,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  onBack: () => void
}) {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        {icon}
      </span>
      <h1 className="mt-4 text-xl font-bold text-slate-800">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        العودة للوحة
      </button>
    </main>
  )
}

function ReviewPending() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col px-4 py-4">
      <div className="mb-6 h-2 w-full animate-pulse rounded-full bg-slate-200" />
      <div className="h-80 w-full animate-pulse rounded-2xl bg-slate-200 sm:h-96" />
    </main>
  )
}

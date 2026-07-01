import type { ReviewCard } from '../schemas/word'
import { frenchOnly } from '../lib/speech'
import { CopyButton } from './CopyButton'
import { PronounceButton } from './PronounceButton'

interface FlashcardProps {
  card: ReviewCard
  isFlipped: boolean
  onFlip: () => void
}

/** A 3D flip card: French (front) → Arabic meaning + example (back). */
export function Flashcard({ card, isFlipped, onFlip }: FlashcardProps) {
  return (
    <div
      className="w-full cursor-pointer select-none perspective-[1200px]"
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onFlip()
        }
      }}
      aria-label="بطاقة — اضغط للقلب"
    >
      <div
        className={`relative h-80 w-full transition-transform duration-500 transform-3d sm:h-96 ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front — French */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg backface-hidden">
          {card.type ? (
            <span className="absolute top-4 right-4 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
              {card.type}
            </span>
          ) : null}

          <p className="mb-3 text-xs uppercase tracking-widest text-slate-400">
            Français
          </p>
          <p
            dir="ltr"
            className="text-3xl font-bold leading-tight text-slate-800 sm:text-4xl"
          >
            {card.frenchText}
          </p>
          <div className="mt-5 flex items-center gap-1">
            <PronounceButton text={card.frenchText} />
            <CopyButton text={card.frenchText} label="نسخ الكلمة" />
          </div>

          <p className="absolute bottom-4 text-xs text-slate-400">
            اضغط لإظهار المعنى
          </p>
        </div>

        {/* Back — Arabic meaning + example */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-auto rounded-2xl bg-slate-800 p-6 text-white shadow-xl backface-hidden rotate-y-180">
          <div dir="rtl" className="text-center" lang="ar">
            <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">
              المعنى
            </p>
            <p className="text-2xl font-bold leading-relaxed sm:text-3xl">
              {card.arabicMeaning}
            </p>
            <div dir="ltr" className="mt-2 flex justify-center">
              <CopyButton
                text={card.arabicMeaning}
                size="sm"
                label="نسخ المعنى"
              />
            </div>
          </div>

          {card.exampleSentence ? (
            <div className="w-full rounded-lg bg-slate-700/50 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400">
                  مثال من السياق
                </span>
                <span className="flex items-center gap-1">
                  <PronounceButton
                    text={frenchOnly(card.exampleSentence)}
                    size="sm"
                  />
                  <CopyButton
                    text={card.exampleSentence}
                    size="sm"
                    label="نسخ الجملة"
                  />
                </span>
              </div>
              <p
                dir="auto"
                className="text-center text-sm italic leading-relaxed text-slate-200"
              >
                {card.exampleSentence}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

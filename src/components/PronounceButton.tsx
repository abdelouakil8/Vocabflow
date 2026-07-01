import { useEffect, useState } from 'react'
import { Turtle, Volume2, VolumeX } from 'lucide-react'
import { isSpeechSupported, primeVoices, speakFrench } from '../lib/speech'

interface PronounceButtonProps {
  text: string
  /** Visual size of the controls. */
  size?: 'sm' | 'md'
}

/**
 * Listen buttons (normal + slow speed) for a French word/sentence.
 * Renders a disabled, explained state when the browser lacks Web Speech support.
 */
export function PronounceButton({ text, size = 'md' }: PronounceButtonProps) {
  // Start optimistic (matches SSR), then confirm on the client.
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    const ok = isSpeechSupported()
    setSupported(ok)
    if (ok) primeVoices()
  }, [])

  const iconSize = size === 'sm' ? 16 : 20
  const pad = size === 'sm' ? 'p-1.5' : 'p-2'

  if (!supported) {
    return (
      <span
        className={`inline-flex ${pad} text-slate-300`}
        title="النطق غير مدعوم في هذا المتصفح"
        aria-hidden="true"
      >
        <VolumeX size={iconSize} />
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          speakFrench(text)
        }}
        className={`${pad} rounded-full text-indigo-600 transition-colors hover:bg-indigo-50 active:bg-indigo-100`}
        aria-label="استماع"
        title="استماع"
      >
        <Volume2 size={iconSize} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          speakFrench(text, { slow: true })
        }}
        className={`${pad} rounded-full text-slate-500 transition-colors hover:bg-slate-100 active:bg-slate-200`}
        aria-label="استماع ببطء"
        title="استماع ببطء"
      >
        <Turtle size={iconSize} />
      </button>
    </span>
  )
}

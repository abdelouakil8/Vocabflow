import { useEffect, useState } from 'react'
import { Turtle, Volume2, VolumeX } from 'lucide-react'
import {
  frenchVoiceStatus,
  isSpeechSupported,
  primeVoices,
  speakFrench,
} from '../lib/speech'

interface PronounceButtonProps {
  text: string
  /** Visual size of the controls. */
  size?: 'sm' | 'md'
}

/**
 * Listen buttons (normal + slow speed) for a French word/sentence.
 * Degrades clearly when the browser lacks Web Speech support, or when the
 * device has no French voice installed (which would otherwise mispronounce).
 */
export function PronounceButton({ text, size = 'md' }: PronounceButtonProps) {
  // Start optimistic (matches SSR), then confirm on the client.
  const [supported, setSupported] = useState(true)
  const [noFrenchVoice, setNoFrenchVoice] = useState(false)

  useEffect(() => {
    const ok = isSpeechSupported()
    setSupported(ok)
    if (!ok) return

    primeVoices()
    const update = () => setNoFrenchVoice(frenchVoiceStatus() === 'missing')
    update()
    window.speechSynthesis.addEventListener('voiceschanged', update)
    return () =>
      window.speechSynthesis.removeEventListener('voiceschanged', update)
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

  // Voices loaded but no French one → reading would use the device's default
  // (e.g. Chinese) voice. Signal it instead of playing a wrong-accent reading.
  if (noFrenchVoice) {
    return (
      <span
        className={`inline-flex ${pad} text-amber-500`}
        title="لا يوجد صوت فرنسي مثبّت على هذا الجهاز. ثبّت حزمة النطق الفرنسية (Google Text-to-Speech) لتفعيل النطق."
        aria-label="النطق الفرنسي غير متوفّر — ثبّت حزمة النطق الفرنسية"
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

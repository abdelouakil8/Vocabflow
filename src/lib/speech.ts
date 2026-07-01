/**
 * French pronunciation via the browser's Web Speech API (window.speechSynthesis).
 * No external keys. All functions are SSR-safe (no-op on the server).
 */

let voicesCache: Array<SpeechSynthesisVoice> = []

export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  )
}

function refreshVoices(): Array<SpeechSynthesisVoice> {
  if (!isSpeechSupported()) return []
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) voicesCache = voices
  return voicesCache
}

/**
 * Warm up the voice list. getVoices() is async in some browsers (empty until the
 * 'voiceschanged' event), so call this on mount.
 */
export function primeVoices(): void {
  if (!isSpeechSupported()) return
  refreshVoices()
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
}

/** Pick the best available French voice. */
function pickFrenchVoice(): SpeechSynthesisVoice | null {
  const voices = voicesCache.length > 0 ? voicesCache : refreshVoices()
  const french = voices.filter((v) => v.lang.toLowerCase().startsWith('fr'))
  if (french.length === 0) return null

  const exact = french.filter((v) => v.lang.toLowerCase() === 'fr-fr')
  const pool = exact.length > 0 ? exact : french

  // Prefer higher-quality named voices when present.
  const preferred = [
    'google',
    'natural',
    'amélie',
    'amelie',
    'thomas',
    'denise',
    'hortense',
    'audrey',
  ]
  const nice = pool.find((v) =>
    preferred.some((name) => v.name.toLowerCase().includes(name)),
  )
  return nice ?? pool[0] ?? null
}

export type FrenchVoiceStatus = 'available' | 'missing' | 'unknown'

/**
 * Whether a French voice is installed on this device.
 * - 'available': at least one fr-* voice exists
 * - 'missing': voices are loaded but none is French (→ would mispronounce)
 * - 'unknown': voice list not ready yet (can't tell)
 */
export function frenchVoiceStatus(): FrenchVoiceStatus {
  if (!isSpeechSupported()) return 'unknown'
  const voices = voicesCache.length > 0 ? voicesCache : refreshVoices()
  if (voices.length === 0) return 'unknown'
  return voices.some((v) => v.lang.toLowerCase().startsWith('fr'))
    ? 'available'
    : 'missing'
}

/** Remove parenthetical content (e.g. an Arabic gloss) so TTS reads only the French. */
export function frenchOnly(text: string): string {
  return text.replace(/\(.*?\)/g, '').trim() || text
}

export interface SpeakOptions {
  slow?: boolean
}

export function speakFrench(text: string, options: SpeakOptions = {}): void {
  if (!isSpeechSupported()) return
  const clean = text.trim()
  if (!clean) return

  const voice = pickFrenchVoice()
  // If voices are loaded and none is French, stay silent instead of reading
  // the French text with the device's default (e.g. Chinese) voice.
  if (!voice && frenchVoiceStatus() === 'missing') return

  const synth = window.speechSynthesis
  synth.cancel() // interrupt anything currently speaking

  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.lang = 'fr-FR'
  if (voice) utterance.voice = voice
  utterance.rate = options.slow ? 0.6 : 1
  utterance.pitch = 1
  synth.speak(utterance)
}

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface CopyButtonProps {
  text: string
  size?: 'sm' | 'md'
  /** Accessible label, e.g. "نسخ الكلمة". */
  label?: string
}

/** Copy text to the clipboard with brief visual confirmation. */
export function CopyButton({ text, size = 'md', label = 'نسخ' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const iconSize = size === 'sm' ? 16 : 20
  const pad = size === 'sm' ? 'p-1.5' : 'p-2'

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // Clipboard unavailable (insecure context / denied) — fail quietly.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`${pad} rounded-full text-slate-500 transition-colors hover:bg-slate-100 active:bg-slate-200`}
      aria-label={label}
      title={copied ? 'تم النسخ' : label}
    >
      {copied ? (
        <Check size={iconSize} className="text-green-600" />
      ) : (
        <Copy size={iconSize} />
      )}
    </button>
  )
}

import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { RefreshCw } from 'lucide-react'
import { syncFromSheet } from '../server/sync'

type SyncState = 'idle' | 'loading' | 'error'

export function SyncButton() {
  const router = useRouter()
  const [state, setState] = useState<SyncState>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const run = async () => {
    setState('loading')
    setMessage(null)
    try {
      const result = await syncFromSheet()
      setMessage(
        result.inserted > 0
          ? `أُضيفت ${result.inserted} كلمة جديدة`
          : 'كل الكلمات محدّثة بالفعل',
      )
      await router.invalidate()
      setState('idle')
    } catch {
      setMessage('تعذّرت المزامنة. تحقّق من الاتصال ومن مشاركة الشيت.')
      setState('error')
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={run}
        disabled={state === 'loading'}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw
          size={16}
          className={state === 'loading' ? 'animate-spin' : ''}
        />
        {state === 'loading' ? 'جارٍ المزامنة…' : 'مزامنة الآن'}
      </button>
      {message ? (
        <p
          className={`text-xs ${
            state === 'error' ? 'text-red-600' : 'text-slate-500'
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}

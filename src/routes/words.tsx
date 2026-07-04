import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { getWordList } from '../server/words'
import { PronounceButton } from '../components/PronounceButton'
import type { WordStatus } from '../schemas/word'

export const Route = createFileRoute('/words')({
  loader: () => getWordList(),
  component: WordsPage,
  pendingComponent: WordsPending,
})

const STATUS_META: Record<
  WordStatus,
  { label: string; dot: string; text: string }
> = {
  new: { label: 'جديدة', dot: 'bg-slate-300', text: 'text-slate-500' },
  beginner: { label: 'مبتدئة', dot: 'bg-red-400', text: 'text-red-600' },
  familiar: { label: 'مألوفة', dot: 'bg-yellow-400', text: 'text-yellow-600' },
  confident: { label: 'واثقة', dot: 'bg-emerald-400', text: 'text-emerald-600' },
  mastered: { label: 'مُتقَنة', dot: 'bg-amber-400', text: 'text-amber-600' },
}

function WordsPage() {
  const words = Route.useLoaderData()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return words
    return words.filter(
      (w) =>
        w.frenchText.toLowerCase().includes(q) ||
        w.arabicMeaning.toLowerCase().includes(q) ||
        (w.type?.toLowerCase().includes(q) ?? false),
    )
  }, [search, words])

  if (words.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-slate-500">
          لا توجد كلمات بعد.{' '}
          <Link to="/" className="font-medium text-indigo-600 hover:underline">
            زامِن من الرئيسية
          </Link>{' '}
          للبدء.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-800">
          الكلمات{' '}
          <span className="text-sm font-normal text-slate-400">
            ({filtered.length})
          </span>
        </h1>
        <div className="relative w-full sm:w-64">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث / Rechercher…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          لا نتائج مطابقة لـ «{search}»
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((w) => {
            const meta = STATUS_META[w.status]
            return (
              <li
                key={w.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p
                        dir="ltr"
                        className="truncate font-semibold text-slate-900"
                      >
                        {w.frenchText}
                      </p>
                      <PronounceButton text={w.frenchText} size="sm" />
                    </div>
                    {w.type ? (
                      <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                        {w.type}
                      </span>
                    ) : null}
                    <p
                      dir="rtl"
                      lang="ar"
                      className="mt-1.5 leading-relaxed text-slate-700"
                    >
                      {w.arabicMeaning}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    <span className={`text-xs ${meta.text}`}>{meta.label}</span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}

function WordsPending() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 h-7 w-32 animate-pulse rounded bg-slate-200" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    </main>
  )
}

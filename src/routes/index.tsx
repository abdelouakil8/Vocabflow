import { useEffect } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  BookOpen,
  Eye,
  Flame,
  GraduationCap,
  Layers,
  Play,
  Shield,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { getDashboardStats } from '../server/words'
import type { DashboardStats } from '../schemas/word'
import { syncFromSheet } from '../server/sync'
import { StatCard } from '../components/StatCard'
import { SyncButton } from '../components/SyncButton'

// Module-level guard: silent sync runs at most once per page load (session).
let didSilentSync = false

export const Route = createFileRoute('/')({
  loader: () => getDashboardStats(),
  component: Dashboard,
  pendingComponent: DashboardPending,
})

function getSmartMessage(stats: DashboardStats): string {
  if (stats.reviewable > 0 && stats.due > 0) {
    return `لديك ${stats.due} كلمة مستحقة للمراجعة — الأضعف أولاً.`
  }
  if (stats.reviewable > 0 && stats.due === 0) {
    return `أنهيت المستحقات! ${stats.reviewable} كلمة متاحة للمراجعة الإضافية.`
  }
  if (stats.mastered === stats.total && stats.total > 0) {
    return `أتقنت كل كلماتك! 🎉 ستعود للمراجعة تلقائياً.`
  }
  return 'راحة مستحقة — مراجعتك القادمة قريباً ⏰'
}

/** 5-level progress bar segments */
const LEVEL_CONFIG = [
  { key: 'mastered' as const, label: 'متقنة', color: 'bg-amber-400' },
  { key: 'confident' as const, label: 'واثقة', color: 'bg-emerald-400' },
  { key: 'familiar' as const, label: 'مألوفة', color: 'bg-yellow-400' },
  { key: 'beginner' as const, label: 'مبتدئة', color: 'bg-red-400' },
  { key: 'newCount' as const, label: 'جديدة', color: 'bg-slate-300' },
]

function Dashboard() {
  const stats = Route.useLoaderData()
  const router = useRouter()

  useEffect(() => {
    if (didSilentSync) return
    didSilentSync = true
    syncFromSheet()
      .then((result) => {
        if (result.inserted > 0) void router.invalidate()
      })
      .catch(() => {
        // Silent: the manual button surfaces sync errors.
      })
  }, [router])

  if (stats.total === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Sparkles size={28} />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-800">
            مرحبًا بك في VocabFlow
          </h1>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            لا توجد كلمات بعد. زامِن من Google Sheet لجلب كلماتك وبدء المراجعة.
          </p>
          <div className="mt-6">
            <SyncButton />
          </div>
        </div>
      </main>
    )
  }

  const message = getSmartMessage(stats)
  const hasCards = stats.reviewable > 0

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">أهلًا 👋</h1>
        <p className="mt-1 text-sm text-slate-500">{message}</p>
      </div>

      {/* Primary CTA — always active when there are reviewable cards */}
      <Link
        to="/review"
        disabled={!hasCards}
        className={`group relative mb-6 flex items-center justify-between overflow-hidden rounded-2xl p-6 transition-all ${
          hasCards
            ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700'
            : 'pointer-events-none cursor-not-allowed bg-slate-100 text-slate-400'
        }`}
      >
        <div>
          <p className="text-lg font-bold">ابدأ جلسة المراجعة</p>
          <p
            className={`mt-0.5 text-sm ${
              hasCards ? 'text-indigo-100' : 'text-slate-400'
            }`}
          >
            {hasCards
              ? `${stats.reviewable} كلمة للمراجعة`
              : 'كل الكلمات متقنة — أحسنت!'}
          </p>
        </div>
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            hasCards ? 'bg-white/20' : 'bg-white/40'
          }`}
        >
          <Play size={24} fill="currentColor" />
        </span>
      </Link>

      {/* 5-level progress bar */}
      {stats.total > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>تقدّمك</span>
            <span>
              {Math.round((stats.mastered / stats.total) * 100)}% إتقان
            </span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
            {LEVEL_CONFIG.map(({ key, color }) => {
              const count = stats[key]
              if (count === 0) return null
              const pct = (count / stats.total) * 100
              return (
                <div
                  key={key}
                  className={`${color} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              )
            })}
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
            {LEVEL_CONFIG.map(({ key, label, color }) => {
              const count = stats[key]
              if (count === 0) return null
              return (
                <span key={key} className="flex items-center gap-1">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${color}`}
                  />
                  {label} {count}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Stats grid (mobile-first: 2 columns) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="إجمالي الكلمات"
          value={stats.total}
          icon={<Layers size={20} />}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="للمراجعة"
          value={stats.reviewable}
          icon={<TrendingUp size={20} />}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="مُتقَنة"
          value={stats.mastered}
          icon={<GraduationCap size={20} />}
          accent="bg-amber-50 text-amber-500"
        />
        <StatCard
          label="واثقة"
          value={stats.confident}
          icon={<Shield size={20} />}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="مألوفة"
          value={stats.familiar}
          icon={<Eye size={20} />}
          accent="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          label="مبتدئة + جديدة"
          value={stats.beginner + stats.newCount}
          icon={<Sparkles size={20} />}
          accent="bg-red-50 text-red-500"
        />
      </div>

      {/* Current streak banner */}
      {stats.currentStreak > 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <Flame size={18} />
          <span>
            سلسلتك الحالية: <strong>{stats.currentStreak}</strong> يوم متتالٍ.
            واصل!
          </span>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/words"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
        >
          <BookOpen size={16} />
          تصفّح كل الكلمات
        </Link>
        <SyncButton />
      </div>
    </main>
  )
}

function DashboardPending() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="h-7 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-6 h-24 animate-pulse rounded-2xl bg-slate-200" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    </main>
  )
}

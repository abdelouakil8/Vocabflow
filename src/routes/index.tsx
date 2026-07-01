import { useEffect } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  BookOpen,
  Flame,
  GraduationCap,
  Layers,
  Play,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { getDashboardStats } from '../server/words'
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">أهلًا 👋</h1>
        <p className="mt-1 text-sm text-slate-500">
          {stats.due > 0
            ? `لديك ${stats.due} كلمة مستحقة للمراجعة اليوم.`
            : 'لا كلمات مستحقة الآن — أحسنت!'}
        </p>
      </div>

      {/* Primary CTA */}
      <Link
        to="/review"
        disabled={stats.due === 0}
        className={`group relative mb-6 flex items-center justify-between overflow-hidden rounded-2xl p-6 transition-all ${
          stats.due > 0
            ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700'
            : 'pointer-events-none cursor-not-allowed bg-slate-100 text-slate-400'
        }`}
      >
        <div>
          <p className="text-lg font-bold">ابدأ جلسة المراجعة</p>
          <p
            className={`mt-0.5 text-sm ${
              stats.due > 0 ? 'text-indigo-100' : 'text-slate-400'
            }`}
          >
            {stats.due > 0
              ? `${stats.due} بطاقة بانتظارك`
              : 'لا شيء مستحق الآن'}
          </p>
        </div>
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            stats.due > 0 ? 'bg-white/20' : 'bg-white/40'
          }`}
        >
          <Play size={24} fill="currentColor" />
        </span>
      </Link>

      {/* Stats grid (mobile-first: 2 columns) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="إجمالي الكلمات"
          value={stats.total}
          icon={<Layers size={20} />}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="مستحقة اليوم"
          value={stats.due}
          icon={<TrendingUp size={20} />}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="مُتقَنة"
          value={stats.mastered}
          icon={<GraduationCap size={20} />}
          accent="bg-green-50 text-green-600"
        />
        <StatCard
          label="قيد التعلّم"
          value={stats.learning}
          icon={<BookOpen size={20} />}
          accent="bg-purple-50 text-purple-600"
        />
        <StatCard
          label="جديدة"
          value={stats.newCount}
          icon={<Sparkles size={20} />}
          accent="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="أطول سلسلة"
          value={
            <span className="flex items-baseline gap-1">
              {stats.longestStreak}
              <span className="text-xs font-normal text-slate-400">يوم</span>
            </span>
          }
          icon={<Flame size={20} />}
          accent="bg-orange-50 text-orange-600"
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

import { Link, useRouter } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'

export function DefaultCatchBoundary({ error }: { error: Error }) {
  const router = useRouter()

  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertTriangle size={28} />
      </span>
      <h1 className="mt-4 text-xl font-bold text-slate-800">حدث خطأ</h1>
      <p className="mt-2 max-w-sm break-words text-sm text-slate-500">
        {error.message}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => router.invalidate()}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          إعادة المحاولة
        </button>
        <Link
          to="/"
          className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          الرئيسية
        </Link>
      </div>
    </main>
  )
}

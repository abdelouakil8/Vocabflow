import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-5xl font-extrabold text-slate-300">404</p>
      <h1 className="mt-4 text-xl font-bold text-slate-800">الصفحة غير موجودة</h1>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        العودة للرئيسية
      </Link>
    </main>
  )
}

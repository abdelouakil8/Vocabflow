import { Link } from '@tanstack/react-router'
import { BookOpen, Layers } from 'lucide-react'

const linkBase =
  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Layers size={18} />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-800">
            VocabFlow
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className={`${linkBase} text-slate-500 hover:text-slate-800`}
            activeProps={{ className: `${linkBase} bg-indigo-50 text-indigo-600` }}
          >
            <Layers size={16} />
            <span>الرئيسية</span>
          </Link>
          <Link
            to="/words"
            className={`${linkBase} text-slate-500 hover:text-slate-800`}
            activeProps={{ className: `${linkBase} bg-indigo-50 text-indigo-600` }}
          >
            <BookOpen size={16} />
            <span>الكلمات</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}

import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  icon: ReactNode
  accent: string
}

export function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`shrink-0 rounded-xl p-2.5 ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

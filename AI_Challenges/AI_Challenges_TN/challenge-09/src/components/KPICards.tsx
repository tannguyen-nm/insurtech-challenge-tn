import type { Claim } from '../types'
import { calcKPIs, fmt } from '../utils/kpi'

const cards = [
  { label: 'Total Claims', key: 'total', format: (v: number) => v.toLocaleString(), color: 'bg-blue-500' },
  { label: 'Approval Rate', key: 'approvalRate', format: (v: number) => `${v.toFixed(1)}%`, color: 'bg-emerald-500' },
  { label: 'Avg Processing Time', key: 'avgProcessingTime', format: (v: number) => `${v.toFixed(1)} days`, color: 'bg-violet-500' },
  { label: 'Total Approved', key: 'totalApproved', format: (v: number) => `$${fmt(v)}`, color: 'bg-amber-500' },
  { label: 'Avg Claim Amount', key: 'avgClaimAmount', format: (v: number) => `$${fmt(v)}`, color: 'bg-rose-500' },
] as const

export default function KPICards({ data }: { data: Claim[] }) {
  const kpis = calcKPIs(data)
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {cards.map(c => (
        <div key={c.key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className={`w-8 h-1 rounded-full ${c.color} mb-3`} />
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{c.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{c.format(kpis[c.key])}</p>
        </div>
      ))}
    </div>
  )
}

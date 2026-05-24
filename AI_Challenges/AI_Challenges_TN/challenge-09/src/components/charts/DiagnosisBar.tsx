import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Claim } from '../../types'

interface Props {
  data: Claim[]
  mode: 'frequency' | 'cost'
  selectedDiagnosis: string | null
  onSelect: (d: string | null) => void
}

export default function DiagnosisBar({ data, mode, selectedDiagnosis, onSelect }: Props) {
  const chartData = useMemo(() => {
    const map = new Map<string, { count: number; cost: number }>()
    data.forEach(c => {
      const prev = map.get(c.diagnosis_icd10) || { count: 0, cost: 0 }
      map.set(c.diagnosis_icd10, { count: prev.count + 1, cost: prev.cost + c.approved_amount })
    })
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, value: mode === 'frequency' ? v.count : Math.round(v.cost) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [data, mode])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Top 10 Diagnoses — {mode === 'frequency' ? 'By Frequency' : 'By Total Cost'}
      </h3>
      <p className="text-xs text-gray-400 mb-3">Click a bar to drill down</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
            tickFormatter={v => mode === 'cost' ? `$${(v/1000).toFixed(0)}K` : String(v)} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} width={65} />
          <Tooltip formatter={(v) => typeof v === 'number' ? (mode === 'cost' ? `$${v.toLocaleString()}` : v.toLocaleString()) : v} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} onClick={(d) => { if (d?.name) onSelect(selectedDiagnosis === d.name ? null : d.name) }}>
            {chartData.map(entry => (
              <Cell key={entry.name}
                fill={selectedDiagnosis === entry.name ? '#1D4ED8' : mode === 'frequency' ? '#2563EB' : '#10B981'}
                cursor="pointer" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

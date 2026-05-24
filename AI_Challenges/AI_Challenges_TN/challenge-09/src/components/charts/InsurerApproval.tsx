import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Claim } from '../../types'

export default function InsurerApproval({ data }: { data: Claim[] }) {
  const chartData = useMemo(() => {
    const map = new Map<string, { total: number; approved: number }>()
    data.forEach(c => {
      const prev = map.get(c.insurer) || { total: 0, approved: 0 }
      map.set(c.insurer, {
        total: prev.total + 1,
        approved: prev.approved + (c.status === 'APPROVED' ? 1 : 0),
      })
    })
    return Array.from(map.entries()).map(([insurer, v]) => ({
      insurer,
      'Approval Rate (%)': v.total ? +((v.approved / v.total) * 100).toFixed(1) : 0,
      'Total Claims': v.total,
    }))
  }, [data])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Approval Rate by Insurer</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="insurer" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="Approval Rate (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="Total Claims" fill="#2563EB" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { startOfWeek, startOfMonth, format } from 'date-fns'
import type { Claim } from '../../types'

export default function ClaimsOverTime({ data }: { data: Claim[] }) {
  const [groupBy, setGroupBy] = useState<'week' | 'month'>('month')

  const chartData = useMemo(() => {
    const map = new Map<string, number>()
    data.forEach(c => {
      const d = new Date(c.submitted_date)
      const key = groupBy === 'month'
        ? format(startOfMonth(d), 'yyyy-MM')
        : format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))
  }, [data, groupBy])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Claims Over Time</h3>
        <div className="flex gap-1">
          {(['month', 'week'] as const).map(g => (
            <button key={g} onClick={() => setGroupBy(g)}
              className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${groupBy === g ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {g === 'month' ? 'Monthly' : 'Weekly'}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false}
            tickFormatter={v => groupBy === 'month' ? v.slice(5) : v.slice(5)} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={false} name="Claims" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

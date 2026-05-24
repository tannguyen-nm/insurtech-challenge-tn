import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Claim } from '../../types'

const COLORS: Record<string, string> = {
  APPROVED: '#10B981', REJECTED: '#EF4444', PENDING: '#F59E0B', IN_REVIEW: '#6366F1'
}

export default function StatusDonut({ data }: { data: Claim[] }) {
  const counts = data.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Claims by Status</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%"
            innerRadius={55} outerRadius={90} paddingAngle={3}
            label={({ percent }) => percent != null ? `${(percent * 100).toFixed(0)}%` : ''}
            labelLine={false}>
            {chartData.map(entry => (
              <Cell key={entry.name} fill={COLORS[entry.name] || '#94A3B8'} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => typeof v === 'number' ? v.toLocaleString() : v} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

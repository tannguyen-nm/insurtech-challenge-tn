import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Claim } from '../../types'

export default function ProcessingHistogram({ data }: { data: Claim[] }) {
  const chartData = useMemo(() => {
    const bins = new Map<number, number>()
    data.filter(c => c.processed_date).forEach(c => {
      const days = Math.round((new Date(c.processed_date).getTime() - new Date(c.submitted_date).getTime()) / 86400000)
      const bin = Math.floor(days / 5) * 5
      bins.set(bin, (bins.get(bin) || 0) + 1)
    })
    return Array.from(bins.entries()).sort((a, b) => a[0] - b[0])
      .map(([bin, count]) => ({ range: `${bin}-${bin + 4}d`, count }))
  }, [data])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Processing Time Distribution</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="range" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} name="Claims" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

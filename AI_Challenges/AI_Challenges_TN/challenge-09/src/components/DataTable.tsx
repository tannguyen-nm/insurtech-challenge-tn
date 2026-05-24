import { useState, useMemo } from 'react'
import Papa from 'papaparse'
import type { Claim } from '../types'

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  PENDING: 'bg-amber-100 text-amber-700',
  IN_REVIEW: 'bg-violet-100 text-violet-700',
}

const COLUMNS: { key: keyof Claim; label: string }[] = [
  { key: 'claim_id', label: 'Claim ID' },
  { key: 'member_name', label: 'Member' },
  { key: 'claim_type', label: 'Type' },
  { key: 'diagnosis_icd10', label: 'ICD-10' },
  { key: 'status', label: 'Status' },
  { key: 'submitted_amount', label: 'Submitted' },
  { key: 'approved_amount', label: 'Approved' },
  { key: 'submitted_date', label: 'Submitted Date' },
  { key: 'insurer', label: 'Insurer' },
  { key: 'country', label: 'Country' },
]

const PAGE_SIZE = 20

export default function DataTable({ data, selectedDiagnosis, onClearDiagnosis }: {
  data: Claim[]
  selectedDiagnosis: string | null
  onClearDiagnosis: () => void
}) {
  const [sortKey, setSortKey] = useState<keyof Claim>('submitted_date')
  const [sortAsc, setSortAsc] = useState(false)
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (av == null) return 1
      if (bv == null) return -1
      return sortAsc ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1)
    })
  }, [data, sortKey, sortAsc])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (k: keyof Claim) => {
    if (k === sortKey) setSortAsc(p => !p)
    else { setSortKey(k); setSortAsc(true) }
    setPage(1)
  }

  const exportCSV = () => {
    const csv = Papa.unparse(data)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'claims_filtered.csv'
    a.click()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Claims Table <span className="text-gray-400 font-normal">({data.length.toLocaleString()} rows)</span>
          </h3>
          {selectedDiagnosis && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              ICD: {selectedDiagnosis}
              <button onClick={onClearDiagnosis} className="ml-1 hover:text-blue-900">×</button>
            </span>
          )}
        </div>
        <button onClick={exportCSV}
          className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              {COLUMNS.map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)}
                  className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wide cursor-pointer hover:text-gray-700 whitespace-nowrap select-none">
                  {col.label} {sortKey === col.key ? (sortAsc ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map(c => (
              <tr key={c.claim_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 font-mono text-gray-600">{c.claim_id}</td>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{c.member_name}</td>
                <td className="px-3 py-2 text-gray-600">{c.claim_type}</td>
                <td className="px-3 py-2 font-mono text-gray-500">{c.diagnosis_icd10}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-gray-700">${c.submitted_amount.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-gray-700">${c.approved_amount.toLocaleString()}</td>
                <td className="px-3 py-2 text-gray-500">{c.submitted_date}</td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.insurer}</td>
                <td className="px-3 py-2 text-gray-600">{c.country}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-1">
          <button onClick={() => setPage(1)} disabled={page === 1}
            className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">«</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">‹</button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">›</button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
            className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">»</button>
        </div>
      </div>
    </div>
  )
}

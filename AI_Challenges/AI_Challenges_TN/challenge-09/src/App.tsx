import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import type { Claim, Filters } from './types'
import { useFilteredData } from './hooks/useFilteredData'
import KPICards from './components/KPICards'
import FilterBar from './components/FilterBar'
import StatusDonut from './components/charts/StatusDonut'
import ClaimsOverTime from './components/charts/ClaimsOverTime'
import DiagnosisBar from './components/charts/DiagnosisBar'
import ProcessingHistogram from './components/charts/ProcessingHistogram'
import InsurerApproval from './components/charts/InsurerApproval'
import DataTable from './components/DataTable'

const DEFAULT_FILTERS: Filters = {
  dateFrom: '', dateTo: '',
  claimTypes: [], insurers: [], countries: [], statuses: [],
}

export default function App() {
  const [allData, setAllData] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string | null>(null)

  useEffect(() => {
    Papa.parse('/claims_dataset.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: ({ data }) => {
        const valid = (data as Claim[]).filter(c => c.claim_id && c.submitted_date && !isNaN(new Date(c.submitted_date).getTime()))
        setAllData(valid)
        setLoading(false)
      },
    })
  }, [])

  const filtered = useFilteredData(allData, filters, selectedDiagnosis)

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading dataset…</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto flex items-center gap-3">
          <img src="https://www.papaya.asia/_next/static/media/ellipse-logo.88c151ff.svg" alt="" width="32" height="32" />
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-none">Papaya Insurance</h1>
            <p className="text-xs text-gray-400">Claims Analytics Dashboard</p>
          </div>
          <span className="ml-auto text-xs text-gray-400">{allData.length.toLocaleString()} total claims · 2024</span>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <FilterBar filters={filters} onChange={f => { setFilters(f); setSelectedDiagnosis(null) }} onReset={() => { setFilters(DEFAULT_FILTERS); setSelectedDiagnosis(null) }} />
        <KPICards data={filtered} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <StatusDonut data={filtered} />
          <ClaimsOverTime data={filtered} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <DiagnosisBar data={filtered} mode="frequency" selectedDiagnosis={selectedDiagnosis} onSelect={setSelectedDiagnosis} />
          <DiagnosisBar data={filtered} mode="cost" selectedDiagnosis={selectedDiagnosis} onSelect={setSelectedDiagnosis} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <ProcessingHistogram data={filtered} />
          <InsurerApproval data={filtered} />
        </div>

        <DataTable data={filtered} selectedDiagnosis={selectedDiagnosis} onClearDiagnosis={() => setSelectedDiagnosis(null)} />
      </main>
    </div>
  )
}

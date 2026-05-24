import type { Filters } from '../types'

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  onReset: () => void
}

const CLAIM_TYPES = ['OUTPATIENT', 'INPATIENT', 'DENTAL', 'MATERNITY']
const INSURERS = ['AIA Thailand', 'Bao Viet', 'AXA HK']
const COUNTRIES = ['Thailand', 'Vietnam', 'Hong Kong']
const STATUSES = ['APPROVED', 'REJECTED', 'PENDING', 'IN_REVIEW']

function MultiSelect({ label, options, value, onChange }: {
  label: string; options: string[]; value: string[]; onChange: (v: string[]) => void
}) {
  const toggle = (o: string) =>
    onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o])
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map(o => (
          <button
            key={o}
            onClick={() => toggle(o)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
              value.includes(o)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function FilterBar({ filters, onChange, onReset }: Props) {
  const set = (k: keyof Filters, v: unknown) => onChange({ ...filters, [k]: v })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-wrap gap-x-6 gap-y-4 items-end">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date From</span>
          <input type="date" value={filters.dateFrom} onChange={e => set('dateFrom', e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date To</span>
          <input type="date" value={filters.dateTo} onChange={e => set('dateTo', e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <MultiSelect label="Claim Type" options={CLAIM_TYPES} value={filters.claimTypes} onChange={v => set('claimTypes', v)} />
        <MultiSelect label="Insurer" options={INSURERS} value={filters.insurers} onChange={v => set('insurers', v)} />
        <MultiSelect label="Country" options={COUNTRIES} value={filters.countries} onChange={v => set('countries', v)} />
        <MultiSelect label="Status" options={STATUSES} value={filters.statuses} onChange={v => set('statuses', v)} />
        <button onClick={onReset}
          className="ml-auto px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Reset All
        </button>
      </div>
    </div>
  )
}

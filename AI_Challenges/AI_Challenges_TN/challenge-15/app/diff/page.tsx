'use client'
import { useEffect, useState } from 'react'
import type { TenantSummary, DiffEntry } from '@/lib/types'

const selectClass =
  'px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]'

export default function DiffPage() {
  const [tenants, setTenants] = useState<TenantSummary[]>([])
  const [tenantA, setTenantA] = useState('')
  const [tenantB, setTenantB] = useState('')
  const [diff, setDiff] = useState<DiffEntry[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/tenants')
      .then(r => r.json())
      .then((data: TenantSummary[]) => setTenants(data))
  }, [])

  const compare = async () => {
    if (!tenantA || !tenantB) return
    setLoading(true)
    const res = await fetch('/api/diff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantIdA: tenantA, tenantIdB: tenantB }),
    })
    if (res.ok) setDiff(await res.json())
    setLoading(false)
  }

  const differences = diff?.filter(d => !d.equal) ?? []

  const nameOf = (id: string) => tenants.find(t => t.tenantId === id)?.name ?? id

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tenant Diff</h1>
        <p className="text-sm text-slate-500 mt-1">Compare configuration between two tenants.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tenant A</label>
            <select
              value={tenantA}
              onChange={e => { setTenantA(e.target.value); setDiff(null) }}
              className={selectClass}
            >
              <option value="">Select tenant...</option>
              {tenants.map(t => (
                <option key={t.tenantId} value={t.tenantId}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="text-slate-400 font-medium pb-2">vs</div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tenant B</label>
            <select
              value={tenantB}
              onChange={e => { setTenantB(e.target.value); setDiff(null) }}
              className={selectClass}
            >
              <option value="">Select tenant...</option>
              {tenants.map(t => (
                <option key={t.tenantId} value={t.tenantId}>{t.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={compare}
            disabled={!tenantA || !tenantB || tenantA === tenantB || loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Comparing...' : 'Compare'}
          </button>
        </div>

        {tenantA && tenantB && tenantA === tenantB && (
          <p className="text-xs text-amber-600 mt-2">Select two different tenants to compare.</p>
        )}
      </div>

      {diff && (
        <div>
          <p className="text-sm text-slate-500 mb-3">
            <span className="font-semibold text-slate-800">{differences.length}</span> difference{differences.length !== 1 ? 's' : ''} found
            {differences.length === 0 ? ' — configurations are identical.' : '.'}
          </p>

          {differences.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-10 text-center">
              <p className="text-green-700 font-medium">
                {nameOf(tenantA)} and {nameOf(tenantB)} have identical configurations.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Path</div>
                <div className="col-span-4 text-xs font-semibold text-red-500 uppercase tracking-wide">{nameOf(tenantA)}</div>
                <div className="col-span-4 text-xs font-semibold text-green-600 uppercase tracking-wide">{nameOf(tenantB)}</div>
              </div>
              {differences.map((entry, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-12 px-4 py-3 text-sm ${
                    i < differences.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <div className="col-span-4 font-mono text-xs text-slate-600 break-all pr-2 self-center">
                    {entry.path}
                  </div>
                  <div className="col-span-4 pr-2">
                    <span className="inline-block text-xs bg-red-50 text-red-700 px-2 py-1 rounded font-mono break-all">
                      {entry.valueA === undefined
                        ? <em className="text-slate-400 not-italic">—</em>
                        : JSON.stringify(entry.valueA)}
                    </span>
                  </div>
                  <div className="col-span-4">
                    <span className="inline-block text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-mono break-all">
                      {entry.valueB === undefined
                        ? <em className="text-slate-400 not-italic">—</em>
                        : JSON.stringify(entry.valueB)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'
import type { TenantVersion } from '@/lib/types'

export function HistoryTab({ tenantId }: { tenantId: string }) {
  const [history, setHistory] = useState<TenantVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [rolling, setRolling] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/tenants/${tenantId}/history`)
    if (res.ok) setHistory(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [tenantId])

  const rollback = async (version: number) => {
    if (!confirm(`Roll back to version ${version}? A new version will be created with the old config.`)) return
    setRolling(version)
    await fetch(`/api/tenants/${tenantId}/rollback/${version}`, { method: 'PUT' })
    setRolling(null)
    load()
  }

  const latest = history.length > 0 ? Math.max(...history.map(v => v.version)) : 0

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading history...</div>
  }

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">
        Full audit trail. Rolling back creates a new version — all prior history is preserved.
      </p>
      <div className="space-y-2">
        {[...history].reverse().map(v => (
          <div
            key={v.version}
            className={`flex items-center gap-4 p-4 rounded-lg border ${
              v.version === latest ? 'border-blue-200 bg-blue-50' : 'border-slate-200'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">v{v.version}</span>
                {v.version === latest && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-medium">
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved {formatDate(v.savedAt)} by {v.savedBy}
              </p>
            </div>
            {v.version !== latest && (
              <button
                type="button"
                onClick={() => rollback(v.version)}
                disabled={rolling === v.version}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:border-slate-300 disabled:opacity-50 shrink-0"
              >
                {rolling === v.version ? 'Rolling back...' : 'Roll Back'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

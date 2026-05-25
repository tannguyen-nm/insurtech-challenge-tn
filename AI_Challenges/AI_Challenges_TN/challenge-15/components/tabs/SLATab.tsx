'use client'
import { useFormContext } from 'react-hook-form'
import { CLAIM_TYPES } from '@/lib/types'
import type { TenantConfig } from '@/lib/types'

const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export function SLATab() {
  const { register } = useFormContext<TenantConfig>()

  return (
    <div className="space-y-3">
      {CLAIM_TYPES.map(type => (
        <div key={type} className="border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">{type}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Target Business Days</label>
              <input
                type="number"
                min={1}
                {...register(`sla.${type}.targetBusinessDays`, { valueAsNumber: true })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Escalate To (email)</label>
              <input
                type="email"
                {...register(`sla.${type}.escalateTo`)}
                placeholder="e.g. manager@company.com"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

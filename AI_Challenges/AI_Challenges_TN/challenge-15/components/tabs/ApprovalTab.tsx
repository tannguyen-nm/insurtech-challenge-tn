'use client'
import { useFormContext, useFieldArray } from 'react-hook-form'
import type { TenantConfig } from '@/lib/types'

const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelClass = 'block text-xs font-medium text-slate-600 mb-1'

export function ApprovalTab() {
  const { register, control } = useFormContext<TenantConfig>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'approvalRules.tiers',
  })

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Auto-Approval Threshold ($)</label>
        <input
          type="number"
          min={0}
          {...register('approvalRules.autoApprovalThreshold', { valueAsNumber: true })}
          className={`${inputClass} max-w-xs`}
        />
        <p className="text-xs text-slate-400 mt-1">
          Claims at or below this amount are auto-approved without human review. Set to 0 to disable.
        </p>
      </div>

      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium text-slate-700">Approval Tiers</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ordered by amount — claim routes to the first tier it falls under.
            </p>
          </div>
          <button
            type="button"
            onClick={() => append({ maxAmount: 0, requiredRole: '' })}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 shrink-0"
          >
            + Add Tier
          </button>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
            <p className="text-sm text-slate-400">No tiers configured. Claims above threshold require manual routing.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field, i) => (
              <div
                key={field.id}
                className="flex items-end gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <span className="text-xs font-semibold text-slate-500 pb-2 w-12 shrink-0">Tier {i + 1}</span>
                <div className="flex-1">
                  <label className={labelClass}>Max Amount ($)</label>
                  <input
                    type="number"
                    min={0}
                    {...register(`approvalRules.tiers.${i}.maxAmount`, { valueAsNumber: true })}
                    placeholder="e.g. 10000"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Required Role</label>
                  <input
                    {...register(`approvalRules.tiers.${i}.requiredRole`)}
                    placeholder="e.g. Claims Manager"
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-xs text-red-500 hover:text-red-700 pb-2 shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

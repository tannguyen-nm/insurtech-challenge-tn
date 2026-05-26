'use client'
import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { CHANNELS, CLAIM_TYPES, NOTIFICATION_EVENTS } from '@/lib/types'
import type { TenantConfig } from '@/lib/types'

export function NotificationsTab() {
  const { register, control, watch } = useFormContext<TenantConfig>()
  const claimTypes = watch('claimTypes')
  const enabledTypes = CLAIM_TYPES.filter(t => claimTypes?.[t]?.enabled)
  const [activeType, setActiveType] = useState<string>(enabledTypes[0] ?? CLAIM_TYPES[0])

  if (enabledTypes.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        No claim types enabled. Enable at least one in the Claim Types tab first.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Configure notification channels per claim type.</p>

      {/* Claim type selector */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-0">
        {enabledTypes.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveType(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg border border-b-0 -mb-px transition-colors ${
              activeType === t
                ? 'bg-white border-slate-200 text-blue-600'
                : 'bg-slate-50 border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Events for active claim type */}
      <div className="space-y-3">
        {NOTIFICATION_EVENTS.map(event => (
          <div key={event} className="border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              {event.replace(/_/g, ' ')}
            </h3>

            <Controller
              name={`notifications.${activeType}.${event}.channels`}
              control={control}
              render={({ field }) => (
                <div className="flex gap-2 flex-wrap">
                  {CHANNELS.map(ch => {
                    const checked = (field.value as string[])?.includes(ch) ?? false
                    return (
                      <label
                        key={ch}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-xs font-medium transition-colors select-none ${
                          checked
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            const next = e.target.checked
                              ? [...((field.value as string[]) ?? []), ch]
                              : ((field.value as string[]) ?? []).filter(c => c !== ch)
                            field.onChange(next)
                          }}
                          className="sr-only"
                        />
                        {ch}
                      </label>
                    )
                  })}
                </div>
              )}
            />

            <div className="mt-3">
              <label className="block text-xs text-slate-500 mb-1">Custom Template (optional)</label>
              <textarea
                {...register(`notifications.${activeType}.${event}.customTemplate`)}
                rows={2}
                placeholder="Leave blank to use default template..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-700"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

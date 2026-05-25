'use client'
import { Controller, useFormContext } from 'react-hook-form'
import { CHANNELS, NOTIFICATION_EVENTS } from '@/lib/types'
import type { TenantConfig } from '@/lib/types'

export function NotificationsTab() {
  const { register, control } = useFormContext<TenantConfig>()

  return (
    <div className="space-y-4">
      {NOTIFICATION_EVENTS.map(event => (
        <div key={event} className="border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">
            {event.replace(/_/g, ' ')}
          </h3>

          <Controller
            name={`notifications.${event}.channels`}
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
                            ? [...(field.value as string[]), ch]
                            : (field.value as string[]).filter(c => c !== ch)
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
              {...register(`notifications.${event}.customTemplate`)}
              rows={2}
              placeholder="Leave blank to use default template..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-700"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

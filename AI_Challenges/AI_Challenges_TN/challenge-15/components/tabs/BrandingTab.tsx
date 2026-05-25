'use client'
import { Controller, useFormContext } from 'react-hook-form'
import type { TenantConfig } from '@/lib/types'

const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelClass = 'block text-sm font-medium text-slate-700 mb-1'

export function BrandingTab({ isNew }: { isNew?: boolean }) {
  const { register, control, watch } = useFormContext<TenantConfig>()
  const name = watch('name')
  const primary = watch('branding.primaryColor')
  const secondary = watch('branding.secondaryColor')

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Tenant ID</label>
          <input
            {...register('tenantId')}
            readOnly={!isNew}
            placeholder="e.g. safeguard-ins"
            className={`${inputClass} ${!isNew ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
          />
          {isNew && (
            <p className="text-xs text-slate-400 mt-1">Lowercase letters, numbers, hyphens. Cannot change later.</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Tenant Name</label>
          <input {...register('name')} placeholder="e.g. SafeGuard Insurance" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Logo URL</label>
        <input {...register('branding.logoUrl')} placeholder="https://example.com/logo.png" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(['primaryColor', 'secondaryColor'] as const).map((key) => (
          <div key={key}>
            <label className={labelClass}>{key === 'primaryColor' ? 'Primary Color' : 'Secondary Color'}</label>
            <Controller
              name={`branding.${key}`}
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={field.value ?? '#000000'}
                    onChange={field.onChange}
                    className="h-9 w-12 rounded border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    className={`${inputClass} flex-1 font-mono`}
                  />
                </div>
              )}
            />
          </div>
        ))}
      </div>

      <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Brand Preview</p>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: primary }}
          >
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: secondary }} />
          </div>
          <span className="font-semibold text-slate-800 text-sm">{name || 'Tenant Name'}</span>
        </div>
        <div className="flex gap-2">
          <span
            className="px-3 py-1 rounded text-white text-xs font-medium"
            style={{ backgroundColor: primary }}
          >
            Primary
          </span>
          <span
            className="px-3 py-1 rounded text-white text-xs font-medium"
            style={{ backgroundColor: secondary }}
          >
            Secondary
          </span>
        </div>
      </div>
    </div>
  )
}

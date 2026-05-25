'use client'
import { useFormContext } from 'react-hook-form'
import type { TenantConfig } from '@/lib/types'

export function PreviewTab() {
  const { watch } = useFormContext<TenantConfig>()
  const config = watch()

  return (
    <div>
      <p className="text-sm text-slate-500 mb-3">Live JSON preview of the current form state — exactly what will be saved.</p>
      <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-[560px] leading-relaxed font-mono">
        {JSON.stringify(config, null, 2)}
      </pre>
    </div>
  )
}

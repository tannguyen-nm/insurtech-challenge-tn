'use client'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { CLAIM_TYPES } from '@/lib/types'
import type { TenantConfig } from '@/lib/types'

function DocTagInput({ path }: { path: string }) {
  const { watch, setValue } = useFormContext<TenantConfig>()
  const [input, setInput] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docs = (watch(path as any) as string[]) || []

  const add = () => {
    const val = input.trim()
    if (val && !docs.includes(val)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue(path as any, [...docs, val])
    }
    setInput('')
  }

  return (
    <div className="flex flex-wrap gap-1 min-h-[32px] p-1 border border-slate-200 rounded-lg bg-white">
      {docs.map((doc, i) => (
        <span
          key={i}
          className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
        >
          {doc}
          <button
            type="button"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={() => setValue(path as any, docs.filter((_, j) => j !== i))}
            className="ml-0.5 hover:text-red-500 font-bold leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); add() }
        }}
        onBlur={add}
        placeholder="Add, press Enter"
        className="px-1 py-0.5 text-xs outline-none bg-transparent min-w-[100px] placeholder-slate-300"
      />
    </div>
  )
}

export function ClaimTypesTab() {
  const { register, watch } = useFormContext<TenantConfig>()

  return (
    <div className="space-y-3">
      {CLAIM_TYPES.map(type => {
        const enabled = watch(`claimTypes.${type}.enabled`)
        return (
          <div
            key={type}
            className={`border rounded-lg p-4 transition-colors ${
              enabled ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register(`claimTypes.${type}.enabled`)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
              </label>
              <span className="font-semibold text-slate-800 text-sm">{type}</span>
              {!enabled && <span className="text-xs text-slate-400">Disabled — will not appear in claim intake</span>}
            </div>

            {enabled && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Required Documents</label>
                  <DocTagInput path={`claimTypes.${type}.requiredDocs`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Optional Documents</label>
                  <DocTagInput path={`claimTypes.${type}.optionalDocs`} />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

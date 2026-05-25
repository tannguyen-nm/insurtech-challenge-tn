'use client'
import { Controller, useFormContext, useFieldArray } from 'react-hook-form'
import type { TenantConfig } from '@/lib/types'

const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export function CustomFieldsTab() {
  const { register, control, watch } = useFormContext<TenantConfig>()
  const { fields, append, remove } = useFieldArray({ control, name: 'customFields' })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">Extra fields collected during claim submission for this tenant.</p>
        <button
          type="button"
          onClick={() => append({ name: '', required: false, type: 'text' })}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 shrink-0"
        >
          + Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
          <p className="text-sm text-slate-400">No custom fields configured.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, i) => {
            const type = watch(`customFields.${i}.type`)
            return (
              <div key={field.id} className="border border-slate-200 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Field Name</label>
                    <input
                      {...register(`customFields.${i}.name`)}
                      placeholder="e.g. Policy Number"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                    <select {...register(`customFields.${i}.type`)} className={inputClass}>
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="select">Select</option>
                    </select>
                  </div>
                  <div className="flex items-end justify-between pb-0.5">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        {...register(`customFields.${i}.required`)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm text-slate-700">Required</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-xs text-red-500 hover:text-red-700 mb-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {type === 'select' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Options <span className="text-slate-400">(comma-separated)</span>
                    </label>
                    <Controller
                      name={`customFields.${i}.options`}
                      control={control}
                      render={({ field: f }) => (
                        <input
                          type="text"
                          value={(f.value as string[] | undefined)?.join(', ') ?? ''}
                          onChange={e =>
                            f.onChange(
                              e.target.value
                                .split(',')
                                .map(s => s.trim())
                                .filter(Boolean)
                            )
                          }
                          placeholder="Option A, Option B, Option C"
                          className={inputClass}
                        />
                      )}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

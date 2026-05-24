'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import type { WizardFormData } from '../../types/wizard'
import { ICD10_CODES } from '../../data/icd10'
import { PROVIDERS } from '../../data/providers'

interface Props {
  register: UseFormRegister<WizardFormData>
  errors: FieldErrors<WizardFormData>
  watch: UseFormWatch<WizardFormData>
  setValue: UseFormSetValue<WizardFormData>
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

const inputCls = (err?: string) =>
  `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    err ? 'border-red-400' : 'border-gray-300'
  }`

export default function Step3Diagnosis({ register, errors, watch, setValue }: Props) {
  const claimType = watch('claimType')
  const admissionDate = watch('admissionDate')
  const dischargeDate = watch('dischargeDate')

  const [icd10Input, setIcd10Input] = useState('')
  const [icd10Open, setIcd10Open] = useState(false)
  const debouncedQuery = useDebounce(icd10Input, 150)
  const icd10Ref = useRef<HTMLDivElement>(null)

  const filteredCodes = useMemo(() => {
    if (!debouncedQuery.trim()) return []
    const q = debouncedQuery.toLowerCase()
    return ICD10_CODES.filter(
      (c) => c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [debouncedQuery])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (icd10Ref.current && !icd10Ref.current.contains(e.target as Node)) {
        setIcd10Open(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Auto-calculate length of stay
  const lengthOfStay = useMemo(() => {
    if (admissionDate && dischargeDate) {
      const diff = new Date(dischargeDate).getTime() - new Date(admissionDate).getTime()
      const days = Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
      return days
    }
    return null
  }, [admissionDate, dischargeDate])

  const isInpatient = claimType === 'inpatient'

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Diagnosis & Treatment</h2>
      <p className="text-gray-500 text-sm mb-6">Provide details about the diagnosis and treatment received.</p>

      <div className="space-y-4">
        {/* Diagnosis description */}
        <Field label="Diagnosis Description" required error={errors.diagnosisDescription?.message}>
          <textarea
            {...register('diagnosisDescription', {
              required: 'Diagnosis description is required',
              minLength: { value: 10, message: 'Must be at least 10 characters' },
            })}
            rows={3}
            placeholder="Describe the diagnosis or medical condition..."
            className={`${inputCls(errors.diagnosisDescription?.message)} resize-none`}
          />
        </Field>

        {/* ICD-10 Autocomplete */}
        <Field label="ICD-10 Code" required error={errors.icd10Code?.message}>
          <div ref={icd10Ref} className="relative">
            <input
              type="text"
              value={icd10Input}
              onChange={(e) => {
                setIcd10Input(e.target.value)
                setIcd10Open(true)
                if (!e.target.value) {
                  setValue('icd10Code', '')
                  setValue('icd10Description', '')
                }
              }}
              onFocus={() => icd10Input && setIcd10Open(true)}
              placeholder="Search by code or description..."
              className={inputCls(errors.icd10Code?.message)}
              autoComplete="off"
            />
            <input type="hidden" {...register('icd10Code', { required: 'Please select an ICD-10 code' })} />
            <input type="hidden" {...register('icd10Description')} />

            {icd10Open && filteredCodes.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {filteredCodes.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setValue('icd10Code', c.code, { shouldValidate: true })
                        setValue('icd10Description', c.description)
                        setIcd10Input(`${c.code} — ${c.description}`)
                        setIcd10Open(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex gap-3"
                    >
                      <span className="font-mono font-semibold text-blue-700 shrink-0">{c.code}</span>
                      <span className="text-gray-700">{c.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Field>

        {/* Date fields */}
        {isInpatient ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Admission Date" required error={errors.admissionDate?.message}>
              <input
                type="date"
                {...register('admissionDate', { required: 'Admission date is required' })}
                className={inputCls(errors.admissionDate?.message)}
                max={dischargeDate || undefined}
              />
            </Field>
            <Field label="Discharge Date" required error={errors.dischargeDate?.message}>
              <input
                type="date"
                {...register('dischargeDate', { required: 'Discharge date is required' })}
                className={inputCls(errors.dischargeDate?.message)}
                min={admissionDate || undefined}
              />
            </Field>
            {lengthOfStay !== null && (
              <div className="sm:col-span-2">
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Length of Stay: <strong>{lengthOfStay} {lengthOfStay === 1 ? 'day' : 'days'}</strong>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Field label="Treatment Date" required error={errors.treatmentDate?.message}>
            <input
              type="date"
              {...register('treatmentDate', { required: 'Treatment date is required' })}
              className={inputCls(errors.treatmentDate?.message)}
              max={new Date().toISOString().split('T')[0]}
            />
          </Field>
        )}

        {/* Provider */}
        <Field label="Provider / Hospital Name" required error={errors.providerName?.message}>
          <input
            type="text"
            {...register('providerName', { required: 'Provider name is required' })}
            list="providers-list"
            placeholder="Search or enter hospital / clinic name..."
            className={inputCls(errors.providerName?.message)}
          />
          <datalist id="providers-list">
            {PROVIDERS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>

        {/* Inpatient only: Admission reason */}
        {isInpatient && (
          <Field label="Admission Reason" required error={errors.admissionReason?.message}>
            <textarea
              {...register('admissionReason', {
                required: isInpatient ? 'Admission reason is required' : false,
              })}
              rows={2}
              placeholder="Reason for hospital admission..."
              className={`${inputCls(errors.admissionReason?.message)} resize-none`}
            />
          </Field>
        )}
      </div>
    </div>
  )
}

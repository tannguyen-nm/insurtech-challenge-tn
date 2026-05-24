'use client'

import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import type { WizardFormData } from '../../types/wizard'
import { MOCK_MEMBER } from '../../data/member'

interface Props {
  register: UseFormRegister<WizardFormData>
  errors: FieldErrors<WizardFormData>
  watch: UseFormWatch<WizardFormData>
  setValue: UseFormSetValue<WizardFormData>
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

const inputCls = (err?: string) =>
  `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    err ? 'border-red-400' : 'border-gray-300'
  }`

export default function Step2MemberInfo({ register, errors, watch, setValue }: Props) {
  const selectedDependent = watch('dependent')

  const handleDependentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setValue('dependent', val)
    if (val === 'self') {
      setValue('memberName', MOCK_MEMBER.name)
      setValue('policyNumber', MOCK_MEMBER.policyNumber)
      setValue('memberId', MOCK_MEMBER.memberId)
      setValue('dob', MOCK_MEMBER.dob)
    } else {
      const dep = MOCK_MEMBER.dependents.find((d) => d.id === val)
      if (dep) {
        setValue('memberName', dep.name)
        setValue('memberId', dep.memberId)
        setValue('dob', dep.dob)
      }
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Member & Policy Information</h2>
      <p className="text-gray-500 text-sm mb-6">Verify and update your details below.</p>

      <div className="space-y-4">
        <Field label="Claim For" error={errors.dependent?.message}>
          <select
            value={selectedDependent}
            onChange={handleDependentChange}
            className={inputCls(errors.dependent?.message)}
          >
            <option value="">— Select —</option>
            <option value="self">Myself — {MOCK_MEMBER.name}</option>
            {MOCK_MEMBER.dependents.map((dep) => (
              <option key={dep.id} value={dep.id}>
                {dep.name} ({dep.relationship})
              </option>
            ))}
          </select>
          <input type="hidden" {...register('dependent', { required: 'Please select who this claim is for' })} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name" error={errors.memberName?.message}>
            <input
              type="text"
              {...register('memberName', { required: 'Name is required' })}
              className={inputCls(errors.memberName?.message)}
              placeholder="Full name"
            />
          </Field>

          <Field label="Date of Birth" error={errors.dob?.message}>
            <input
              type="date"
              {...register('dob', { required: 'Date of birth is required' })}
              className={inputCls(errors.dob?.message)}
            />
          </Field>

          <Field label="Policy Number" error={errors.policyNumber?.message}>
            <input
              type="text"
              {...register('policyNumber', { required: 'Policy number is required' })}
              className={inputCls(errors.policyNumber?.message)}
              placeholder="INS-YYYY-XXXXXX"
            />
          </Field>

          <Field label="Member ID" error={errors.memberId?.message}>
            <input
              type="text"
              {...register('memberId', { required: 'Member ID is required' })}
              className={inputCls(errors.memberId?.message)}
              placeholder="MBR-XXXXXX"
            />
          </Field>
        </div>
      </div>
    </div>
  )
}

'use client'

import { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { WizardFormData, ClaimType } from '../../types/wizard'

interface Props {
  register: UseFormRegister<WizardFormData>
  errors: FieldErrors<WizardFormData>
  selected: ClaimType | ''
  onSelect: (type: ClaimType) => void
}

const CLAIM_TYPES: { type: ClaimType; label: string; description: string; icon: string }[] = [
  {
    type: 'outpatient',
    label: 'Outpatient',
    description: 'Doctor visits, consultations, same-day procedures, and treatments that do not require hospital admission.',
    icon: '🏥',
  },
  {
    type: 'inpatient',
    label: 'Inpatient',
    description: 'Hospital stays requiring overnight admission, surgeries, and extended medical care.',
    icon: '🛏️',
  },
  {
    type: 'dental',
    label: 'Dental',
    description: 'Dental procedures including cleanings, fillings, extractions, orthodontics, and major dental work.',
    icon: '🦷',
  },
]

export default function Step1ClaimType({ register, errors, selected, onSelect }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Select Claim Type</h2>
      <p className="text-gray-500 text-sm mb-6">Choose the type of claim you are submitting.</p>

      <input type="hidden" {...register('claimType')} value={selected} readOnly />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CLAIM_TYPES.map(({ type, label, description, icon }) => {
          const isSelected = selected === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className={[
                'relative rounded-xl border-2 p-6 text-left transition-all duration-150 cursor-pointer',
                isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm',
              ].join(' ')}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              <div className="text-3xl mb-3">{icon}</div>
              <div className={`font-semibold text-base mb-1 ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                {label}
              </div>
              <div className="text-sm text-gray-500 leading-relaxed">{description}</div>
            </button>
          )
        })}
      </div>

      {errors.claimType && (
        <p className="mt-3 text-sm text-red-600">{errors.claimType.message}</p>
      )}
    </div>
  )
}

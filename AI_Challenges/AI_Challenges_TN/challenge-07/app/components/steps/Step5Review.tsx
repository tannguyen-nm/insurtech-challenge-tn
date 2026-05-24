'use client'

import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form'
import type { WizardFormData, DocState } from '../../types/wizard'

interface Props {
  register: UseFormRegister<WizardFormData>
  errors: FieldErrors<WizardFormData>
  watch: UseFormWatch<WizardFormData>
  docs: DocState[]
  isMajorDental: boolean
  onEdit: (step: number) => void
}

function ReviewSection({
  title,
  step,
  onEdit,
  children,
}: {
  title: string
  step: number
  onEdit: (step: number) => void
  children: React.ReactNode
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Edit
        </button>
      </div>
      <div className="px-4 py-3 space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <span className="text-xs font-medium text-gray-500 sm:w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value || <span className="text-gray-400 italic">—</span>}</span>
    </div>
  )
}

function formatDate(val?: string) {
  if (!val) return undefined
  return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function Step5Review({ register, errors, watch, docs, isMajorDental, onEdit }: Props) {
  const values = watch()

  const claimTypeLabel = { outpatient: 'Outpatient', inpatient: 'Inpatient', dental: 'Dental' }[values.claimType as string] ?? values.claimType

  const uploadedDocs = docs.filter((d) => d.status === 'done')

  const losText = (() => {
    if (values.admissionDate && values.dischargeDate) {
      const diff = new Date(values.dischargeDate).getTime() - new Date(values.admissionDate).getTime()
      const days = Math.max(0, Math.round(diff / 86400000))
      return `${days} ${days === 1 ? 'day' : 'days'}`
    }
    return undefined
  })()

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Review & Submit</h2>
      <p className="text-gray-500 text-sm mb-6">Review your claim details before submitting.</p>

      <div className="space-y-4">
        {/* Step 1 */}
        <ReviewSection title="Claim Type" step={1} onEdit={onEdit}>
          <Row label="Type" value={claimTypeLabel} />
        </ReviewSection>

        {/* Step 2 */}
        <ReviewSection title="Member Information" step={2} onEdit={onEdit}>
          <Row label="Name" value={values.memberName} />
          <Row label="Member ID" value={values.memberId} />
          <Row label="Policy Number" value={values.policyNumber} />
          <Row label="Date of Birth" value={formatDate(values.dob)} />
        </ReviewSection>

        {/* Step 3 */}
        <ReviewSection title="Diagnosis & Treatment" step={3} onEdit={onEdit}>
          <Row label="Diagnosis" value={values.diagnosisDescription} />
          {values.icd10Code && (
            <Row label="ICD-10 Code" value={`${values.icd10Code} — ${values.icd10Description}`} />
          )}
          {values.claimType === 'inpatient' ? (
            <>
              <Row label="Admission Date" value={formatDate(values.admissionDate)} />
              <Row label="Discharge Date" value={formatDate(values.dischargeDate)} />
              <Row label="Length of Stay" value={losText} />
              <Row label="Admission Reason" value={values.admissionReason} />
            </>
          ) : (
            <Row label="Treatment Date" value={formatDate(values.treatmentDate)} />
          )}
          <Row label="Provider" value={values.providerName} />
          {values.claimType === 'dental' && (
            <Row label="Major Dental" value={isMajorDental ? 'Yes' : 'No'} />
          )}
        </ReviewSection>

        {/* Step 4 */}
        <ReviewSection title="Documents" step={4} onEdit={onEdit}>
          {uploadedDocs.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No documents uploaded</p>
          ) : (
            uploadedDocs.map((d) => (
              <div key={d.docType} className="flex items-center gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">{d.label}:</span>
                <span className="text-gray-500 truncate">{d.file?.name}</span>
              </div>
            ))
          )}
        </ReviewSection>
      </div>

      {/* Confirmation */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('confirmed', { required: 'Please confirm before submitting' })}
            className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300"
          />
          <span className="text-sm text-blue-900">
            I confirm that all information provided in this claim is accurate and complete to the best of my knowledge.
            I understand that submitting false or misleading information may result in claim denial or policy termination.
          </span>
        </label>
        {errors.confirmed && (
          <p className="mt-2 text-xs text-red-600 pl-7">{errors.confirmed.message}</p>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import StepIndicator from './StepIndicator'
import Step1ClaimType from './steps/Step1ClaimType'
import Step2MemberInfo from './steps/Step2MemberInfo'
import Step3Diagnosis from './steps/Step3Diagnosis'
import Step4Documents from './steps/Step4Documents'
import Step5Review from './steps/Step5Review'
import type { ClaimType, DocState, WizardFormData } from '../types/wizard'
import { MOCK_MEMBER } from '../data/member'

function buildDocList(claimType: ClaimType, isMajorDental: boolean): DocState[] {
  const configs: { docType: string; label: string; required: boolean }[] =
    claimType === 'outpatient'
      ? [
          { docType: 'medical_receipt', label: 'Medical Receipt', required: true },
          { docType: 'prescription', label: 'Prescription', required: false },
        ]
      : claimType === 'inpatient'
      ? [
          { docType: 'discharge_summary', label: 'Discharge Summary', required: true },
          { docType: 'itemized_bill', label: 'Itemized Bill', required: true },
          { docType: 'medical_receipt', label: 'Medical Receipt', required: true },
        ]
      : [
          { docType: 'dental_receipt', label: 'Dental Receipt', required: true },
          { docType: 'treatment_plan', label: 'Treatment Plan', required: isMajorDental },
        ]

  return configs.map((c) => ({
    ...c,
    file: null,
    progress: 0,
    status: 'idle',
  }))
}

export default function WizardForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [docs, setDocs] = useState<DocState[]>([])
  const [isMajorDental, setIsMajorDental] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [docError, setDocError] = useState('')
  const prevClaimType = useRef<ClaimType | ''>('')

  const form = useForm<WizardFormData>({
    defaultValues: {
      claimType: '',
      memberName: MOCK_MEMBER.name,
      policyNumber: MOCK_MEMBER.policyNumber,
      memberId: MOCK_MEMBER.memberId,
      dob: MOCK_MEMBER.dob,
      dependent: 'self',
      diagnosisDescription: '',
      icd10Code: '',
      icd10Description: '',
      treatmentDate: '',
      admissionDate: '',
      dischargeDate: '',
      providerName: '',
      admissionReason: '',
      confirmed: false,
    },
  })

  const { register, handleSubmit, watch, setValue, setError, trigger, formState: { errors } } = form
  const claimType = watch('claimType') as ClaimType | ''

  // Reset docs when claim type changes
  useEffect(() => {
    if (claimType && claimType !== prevClaimType.current) {
      prevClaimType.current = claimType
      setDocs(buildDocList(claimType as ClaimType, false))
      setIsMajorDental(false)
    }
  }, [claimType])

  // Update treatment_plan required when isMajorDental changes
  useEffect(() => {
    setDocs((prev) =>
      prev.map((d) =>
        d.docType === 'treatment_plan' ? { ...d, required: isMajorDental } : d
      )
    )
  }, [isMajorDental])

  // Mock file upload with progress
  const handleFileSelect = (docType: string, file: File) => {
    const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png']
    const MAX_BYTES = 10 * 1024 * 1024

    if (!ACCEPTED.includes(file.type)) {
      setDocs((prev) =>
        prev.map((d) =>
          d.docType === docType ? { ...d, status: 'error', errorMsg: 'Only PDF, JPG, or PNG allowed' } : d
        )
      )
      return
    }
    if (file.size > MAX_BYTES) {
      setDocs((prev) =>
        prev.map((d) =>
          d.docType === docType ? { ...d, status: 'error', errorMsg: 'File exceeds 10MB limit' } : d
        )
      )
      return
    }

    setDocs((prev) =>
      prev.map((d) =>
        d.docType === docType ? { ...d, file, progress: 0, status: 'uploading', errorMsg: undefined } : d
      )
    )
    setDocError('')

    let progress = 0
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 10
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setDocs((prev) =>
          prev.map((d) => (d.docType === docType ? { ...d, progress: 100, status: 'done' } : d))
        )
      } else {
        setDocs((prev) =>
          prev.map((d) => (d.docType === docType ? { ...d, progress } : d))
        )
      }
    }, 200)
  }

  const handleRemove = (docType: string) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.docType === docType ? { ...d, file: null, progress: 0, status: 'idle', errorMsg: undefined } : d
      )
    )
  }

  const step3Fields = (): (keyof WizardFormData)[] => {
    const base: (keyof WizardFormData)[] = ['diagnosisDescription', 'icd10Code', 'providerName']
    if (claimType === 'inpatient') {
      return [...base, 'admissionDate', 'dischargeDate', 'admissionReason']
    }
    return [...base, 'treatmentDate']
  }

  const handleNext = async () => {
    let valid = false

    if (currentStep === 1) {
      if (!claimType) {
        setError('claimType', { message: 'Please select a claim type' })
        return
      }
      valid = true
    } else if (currentStep === 2) {
      valid = await trigger(['memberName', 'policyNumber', 'memberId', 'dob', 'dependent'])
    } else if (currentStep === 3) {
      valid = await trigger(step3Fields())
    } else if (currentStep === 4) {
      const missingRequired = docs.filter((d) => d.required && d.status !== 'done')
      if (missingRequired.length > 0) {
        setDocError(`Please upload: ${missingRequired.map((d) => d.label).join(', ')}`)
        return
      }
      // Wait for any uploading to finish
      const stillUploading = docs.some((d) => d.status === 'uploading')
      if (stillUploading) {
        setDocError('Please wait for uploads to complete.')
        return
      }
      setDocError('')
      valid = true
    }

    if (valid) {
      setCurrentStep((s) => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    setCurrentStep((s) => Math.max(1, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const onSubmit = (data: WizardFormData) => {
    console.log('Claim submitted:', { ...data, docs })
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Claim Submitted!</h2>
        <p className="text-gray-500 mb-2">Your claim has been received and is being processed.</p>
        <p className="text-sm text-gray-400 mb-8">Reference: CLM-{Date.now().toString().slice(-8)}</p>
        <button
          type="button"
          onClick={() => {
            form.reset()
            setDocs([])
            setIsMajorDental(false)
            setCurrentStep(1)
            setSubmitted(false)
            prevClaimType.current = ''
          }}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Submit Another Claim
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepIndicator currentStep={currentStep} onStepClick={handleStepClick} />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 min-h-64">
        {currentStep === 1 && (
          <Step1ClaimType
            register={register}
            errors={errors}
            selected={claimType}
            onSelect={(type) => {
              setValue('claimType', type, { shouldValidate: true })
            }}
          />
        )}
        {currentStep === 2 && (
          <Step2MemberInfo
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        )}
        {currentStep === 3 && (
          <Step3Diagnosis
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        )}
        {currentStep === 4 && (
          <>
            <Step4Documents
              docs={docs}
              isMajorDental={isMajorDental}
              claimType={claimType}
              onFileSelect={handleFileSelect}
              onRemove={handleRemove}
              onMajorDentalChange={setIsMajorDental}
            />
            {docError && (
              <p className="mt-4 text-sm text-red-600 font-medium">{docError}</p>
            )}
          </>
        )}
        {currentStep === 5 && (
          <Step5Review
            register={register}
            errors={errors}
            watch={watch}
            docs={docs}
            isMajorDental={isMajorDental}
            onEdit={(step) => {
              setCurrentStep(step)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            Next
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!watch('confirmed')}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit Claim
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
      </div>
    </form>
  )
}

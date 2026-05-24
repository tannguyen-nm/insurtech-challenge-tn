export type ClaimType = 'outpatient' | 'inpatient' | 'dental'

export interface WizardFormData {
  claimType: ClaimType | ''
  memberName: string
  policyNumber: string
  memberId: string
  dob: string
  dependent: string
  diagnosisDescription: string
  icd10Code: string
  icd10Description: string
  treatmentDate: string
  admissionDate: string
  dischargeDate: string
  providerName: string
  admissionReason: string
  confirmed: boolean
}

export interface Dependent {
  id: string
  name: string
  relationship: string
  memberId: string
  dob: string
}

export interface MemberInfo {
  name: string
  policyNumber: string
  memberId: string
  dob: string
  dependents: Dependent[]
}

export interface ICD10Code {
  code: string
  description: string
}

export interface DocState {
  docType: string
  label: string
  required: boolean
  file: File | null
  progress: number
  status: 'idle' | 'uploading' | 'done' | 'error'
  errorMsg?: string
}

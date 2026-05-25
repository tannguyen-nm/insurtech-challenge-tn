export type ClaimStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID'
export type ClaimType = 'OUTPATIENT' | 'INPATIENT' | 'DENTAL'
export type DocumentType =
  | 'MEDICAL_RECEIPT'
  | 'PRESCRIPTION'
  | 'DISCHARGE_SUMMARY'
  | 'ITEMIZED_BILL'
  | 'DENTAL_RECEIPT'
  | 'TREATMENT_PLAN'

export interface Claim {
  id: string
  policyId: string
  claimType: ClaimType
  status: ClaimStatus
  amount: number
  currency: string
  description: string
  treatmentDate: string
  providerName: string
  diagnosisCode?: string
  submittedAt: string
  updatedAt: string
}

export interface CreateClaimInput {
  policyId: string
  claimType: ClaimType
  amount: number
  currency?: string
  description: string
  treatmentDate: string
  providerName: string
  diagnosisCode?: string
}

export interface ClaimDocument {
  id: string
  claimId: string
  type: DocumentType
  fileName: string
  fileSize: number
  uploadedAt: string
}

export interface ClaimListFilters {
  status?: ClaimStatus
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SDKConfig {
  apiKey: string
  environment: 'sandbox' | 'production'
  timeout?: number
  baseUrl?: string
}

export type StatusChangeCallback = (newStatus: ClaimStatus, claim: Claim) => void

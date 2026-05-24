export interface Claim {
  claim_id: string
  policy_id: string
  member_name: string
  claim_type: 'OUTPATIENT' | 'INPATIENT' | 'DENTAL' | 'MATERNITY'
  diagnosis_icd10: string
  submitted_amount: number
  approved_amount: number
  status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'IN_REVIEW'
  submitted_date: string
  processed_date: string
  assessor: string
  insurer: string
  country: string
}

export interface Filters {
  dateFrom: string
  dateTo: string
  claimTypes: string[]
  insurers: string[]
  countries: string[]
  statuses: string[]
}

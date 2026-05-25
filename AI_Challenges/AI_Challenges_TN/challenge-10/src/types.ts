export interface Claim {
  claim_id: string
  member_id: string
  provider_id: string
  provider_name: string
  claim_date: string
  claim_type: string
  diagnosis_code: string
  procedure_codes: string[]
  submitted_amount: number
  is_weekend: boolean
}

export interface RuleFlag {
  claim_id: string
  rule: string
  triggered: boolean
  severity: number
  evidence: string
}

export interface ScoredClaim {
  claim_id: string
  score: number
  flags: RuleFlag[]
}

export interface Metrics {
  threshold: number
  tp: number
  fp: number
  fn: number
  tn: number
  precision: number
  recall: number
  fpr: number
}

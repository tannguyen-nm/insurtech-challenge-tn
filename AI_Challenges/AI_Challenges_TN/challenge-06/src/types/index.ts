export type BenefitType = 'INPATIENT' | 'OUTPATIENT' | 'DENTAL' | 'MATERNITY';

export type DecisionType =
  | 'COVERED'
  | 'PARTIALLY_COVERED'
  | 'DENIED_WAITING_PERIOD'
  | 'DENIED_EXCLUSION'
  | 'DENIED_LIMIT_EXHAUSTED'
  | 'DEDUCTIBLE_APPLIED';

export interface SubBenefitDef {
  name: string;
  limit_per_visit?: number;
  limit_per_day?: number;
  limit_per_event?: number;
  limit_per_year?: number;
  visits_per_year?: number;
}

export interface BenefitDef {
  type: BenefitType;
  annual_limit: number;
  copay_percentage: number;
  copay_max_per_visit?: number;
  waiting_period_days?: number;
  sub_benefits: SubBenefitDef[];
}

export interface Policy {
  policy_number: string;
  effective_date: string;
  expiry_date: string;
  currency: string;
  deductible: number;
  benefits: BenefitDef[];
  exclusions: string[];
}

export interface Expense {
  expense_id: string;
  date: string;
  benefit_type: BenefitType;
  sub_benefit: string;
  amount: number;
  diagnosis: string;
  provider: string;
}

export interface CoverageResult {
  expense_id: string;
  submitted_amount: number;
  covered_amount: number;
  copay_amount: number;
  deductible_applied: number;
  member_pays: number;
  decision: DecisionType;
  reason: string;
  remaining_annual_limit: number;
  remaining_visit_limit?: number;
}

export interface BenefitSummary {
  benefit_type: BenefitType;
  annual_limit: number;
  used: number;
  remaining: number;
}

export interface CalculatorOutput {
  results: CoverageResult[];
  summary: BenefitSummary[];
  total_submitted: number;
  total_covered: number;
  total_member_pays: number;
}

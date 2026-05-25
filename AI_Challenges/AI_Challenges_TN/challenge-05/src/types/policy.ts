export interface Policyholder {
  name: string;
  type: 'CORPORATE' | 'INDIVIDUAL';
  industry?: string;
  employee_count?: number;
}

export interface Plan {
  name: string;
  tier: string;
  effective_date: string;
  expiry_date: string;
  currency: string;
}

export interface Members {
  total: number;
  employee: number;
  dependent_spouse?: number;
  dependent_child?: number;
}

export type BenefitType = 'INPATIENT' | 'OUTPATIENT' | 'DENTAL' | 'MATERNITY';

export interface SubBenefit {
  name: string;
  limit_per_day?: number;
  limit_per_visit?: number;
  limit_per_event?: number;
  limit_per_year?: number;
  limit_per_pregnancy?: number;
  max_days?: number;
  visits_per_year?: number;
}

export interface Benefit {
  type: BenefitType;
  annual_limit?: number;
  lifetime_limit?: number;
  waiting_period_days?: number;
  sub_benefits: SubBenefit[];
}

export interface CopayEntry {
  percentage: number;
  max_per_visit?: number;
}

export interface Copay {
  inpatient?: CopayEntry;
  outpatient?: CopayEntry;
  dental?: CopayEntry;
  maternity?: CopayEntry;
}

export interface Network {
  type: string;
  hospital_count?: number;
  countries?: string[];
}

export interface Policy {
  policy_number: string;
  policyholder: Policyholder;
  plan: Plan;
  members?: Members;
  benefits: Benefit[];
  exclusions?: string[];
  copay?: Copay;
  network?: Network;
}

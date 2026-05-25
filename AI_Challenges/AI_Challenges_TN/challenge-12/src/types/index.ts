export type RuleType =
  | 'document_requirement'
  | 'sla_check'
  | 'waiting_period'
  | 'data_masking'
  | 'coverage_mandate';

export type ClaimType = 'OUTPATIENT' | 'INPATIENT' | 'DENTAL' | 'MATERNITY' | 'SPECIALIST';

export type OverallStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT';

export type RuleStatus = 'PASS' | 'FAIL' | 'SKIPPED';

export interface Rule {
  rule_id: string;
  rule_type: RuleType;
  description: string;
  parameters: Record<string, unknown>;
  effective_date: string;
  expiry_date?: string;
  always_pass?: boolean;
}

export interface CountryConfig {
  country: string;
  country_name: string;
  effective_date: string;
  rules: Rule[];
}

export interface Claim {
  claim_id: string;
  country: string;
  claim_type: ClaimType;
  submission_date: string;
  policy_start_date: string;
  is_pre_existing: boolean;
  is_emergency?: boolean;
  is_specialist?: boolean;
  documents: string[];
  policy_duration_months?: number;
  national_id?: string;
  full_name?: string;
  hkid?: string;
  processing_days?: number;
}

export interface RuleResult {
  rule_id: string;
  rule_type: RuleType;
  description: string;
  status: RuleStatus;
  message: string;
  remediation?: string;
}

export interface ValidationResult {
  claim_id: string;
  country: string;
  country_name: string;
  overall_status: OverallStatus;
  rules: RuleResult[];
  applied_date: string;
}

export interface RuleDiffItem {
  rule_type: RuleType;
  rule_id_a?: string;
  rule_id_b?: string;
  status: 'only_in_a' | 'only_in_b' | 'differs' | 'same';
  description: string;
  diff?: Record<string, { a: unknown; b: unknown }>;
}

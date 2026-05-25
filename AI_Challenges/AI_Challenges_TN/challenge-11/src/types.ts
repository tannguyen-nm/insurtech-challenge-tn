export type Outcome = "APPROVE" | "REJECT" | "REQUEST_MORE_INFO";

export interface ClaimInput {
  caseId: string;
  claimId: string;
  memberId: string;
  policyId: string;
  claimType: string;
  diagnosisCode: string;
  procedureCode: string;
  claimAmount: number;
  dateOfService: string;
  submittedDocuments: string[];
  description: string;
  expectedOutcome: Outcome;
}

export interface ToolCallLog {
  tool: string;
  input: unknown;
  output: unknown;
  timestamp: string;
}

export interface AssessmentReport {
  caseId: string;
  claimId: string;
  outcome: Outcome;
  coveredAmount?: number;
  documentReview: string;
  policyVerification: string;
  medicalNecessity: string;
  benefitCalculation: string;
  recommendation: string;
  policyCitations: string[];
  rawResponse: string;
}

export interface CaseResult {
  caseId: string;
  toolCalls: ToolCallLog[];
  assessmentReport: AssessmentReport;
}

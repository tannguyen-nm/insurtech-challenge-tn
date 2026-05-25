import type { Actor, Claim, ClaimState } from '../types';

export interface ScenarioStep {
  description: string;
  actor: Actor;
  toState: ClaimState;
  notes?: string;
  claimMutation?: (claim: Claim) => void;
  expectError?: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  initialClaim: () => Claim;
  steps: ScenarioStep[];
}

function baseClaim(id: string): Claim {
  return {
    claim_id: id,
    current_state: 'SUBMITTED',
    documents: [
      { name: 'medical_receipt', status: 'COMPLETE' },
      { name: 'prescription', status: 'COMPLETE' },
    ],
    requested_amount: 5000,
    policy_annual_limit: 50000,
    pending_info_cycle_count: 0,
  };
}

export const SCENARIOS: Scenario[] = [
  // ── Scenario 1: Happy Path ────────────────────────────────────────────────
  {
    id: 'S1',
    name: 'Happy Path',
    description: 'Full lifecycle: SUBMITTED → DOCUMENTS_VERIFIED → UNDER_ASSESSMENT → APPROVED → PAYMENT_INITIATED → CLOSED',
    initialClaim: () => baseClaim('CLM-S1-001'),
    steps: [
      {
        description: 'Document clerk verifies all documents',
        actor: { user_id: 'U001', role: 'document_clerk' },
        toState: 'DOCUMENTS_VERIFIED',
        notes: 'All documents present and valid',
      },
      {
        description: 'Team lead assigns assessor and starts assessment',
        actor: { user_id: 'U002', role: 'team_lead' },
        toState: 'UNDER_ASSESSMENT',
        claimMutation: (c) => { c.assigned_assessor_id = 'ASS-001'; },
        notes: 'Assigned to assessor ASS-001',
      },
      {
        description: 'Assessor approves claim after completing report',
        actor: { user_id: 'U003', role: 'assessor' },
        toState: 'APPROVED',
        claimMutation: (c) => {
          c.assessment_report = 'Claim verified. All documents authentic. Amount within limits.';
          c.approved_amount = 5000;
        },
        notes: 'Approved — amount within policy limit',
      },
      {
        description: 'Finance initiates payment',
        actor: { user_id: 'U004', role: 'finance' },
        toState: 'PAYMENT_INITIATED',
        notes: 'Payment request queued',
      },
      {
        description: 'Finance closes claim after payment confirmed',
        actor: { user_id: 'U004', role: 'finance' },
        toState: 'CLOSED',
        claimMutation: (c) => { c.payment_reference = 'PAY-REF-20240601'; },
        notes: 'Payment confirmed, claim closed',
      },
    ],
  },

  // ── Scenario 2: Rejection Path ────────────────────────────────────────────
  {
    id: 'S2',
    name: 'Rejection Path',
    description: 'Claim rejected after assessment, then closed by system after member acknowledges',
    initialClaim: () => baseClaim('CLM-S2-001'),
    steps: [
      {
        description: 'Document clerk verifies documents',
        actor: { user_id: 'U001', role: 'document_clerk' },
        toState: 'DOCUMENTS_VERIFIED',
      },
      {
        description: 'Team lead starts assessment',
        actor: { user_id: 'U002', role: 'team_lead' },
        toState: 'UNDER_ASSESSMENT',
        claimMutation: (c) => { c.assigned_assessor_id = 'ASS-002'; },
      },
      {
        description: 'Assessor rejects claim — pre-existing condition exclusion',
        actor: { user_id: 'U003', role: 'assessor' },
        toState: 'REJECTED',
        claimMutation: (c) => {
          c.assessment_report = 'Condition pre-dates policy by 2 years.';
          c.rejection_reason = 'Pre-existing condition exclusion applies. Condition documented prior to policy inception.';
        },
        notes: 'Pre-existing condition — excluded under policy terms',
      },
      {
        description: 'System closes claim after member acknowledges rejection',
        actor: { user_id: 'SYSTEM', role: 'system' },
        toState: 'CLOSED',
        claimMutation: (c) => { c.appeal_acknowledged = true; },
        notes: 'Member acknowledged rejection via portal',
      },
    ],
  },

  // ── Scenario 3: Request More Info Loop ────────────────────────────────────
  {
    id: 'S3',
    name: 'Request More Info (1 cycle)',
    description: 'Assessor requests more info once, then approves after info received',
    initialClaim: () => baseClaim('CLM-S3-001'),
    steps: [
      {
        description: 'Document clerk verifies initial documents',
        actor: { user_id: 'U001', role: 'document_clerk' },
        toState: 'DOCUMENTS_VERIFIED',
      },
      {
        description: 'Team lead starts assessment',
        actor: { user_id: 'U002', role: 'team_lead' },
        toState: 'UNDER_ASSESSMENT',
        claimMutation: (c) => { c.assigned_assessor_id = 'ASS-001'; },
      },
      {
        description: 'Assessor requests discharge summary',
        actor: { user_id: 'U003', role: 'assessor' },
        toState: 'PENDING_INFO',
        claimMutation: (c) => { c.missing_info_description = 'Discharge summary required for inpatient stay 2024-05-10'; },
        notes: 'Discharge summary missing for inpatient episode',
      },
      {
        description: 'Document clerk submits discharge summary',
        actor: { user_id: 'U001', role: 'document_clerk' },
        toState: 'DOCUMENTS_VERIFIED',
        claimMutation: (c) => { c.documents.push({ name: 'discharge_summary', status: 'COMPLETE' }); },
        notes: 'Discharge summary received and verified',
      },
      {
        description: 'Team lead restarts assessment',
        actor: { user_id: 'U002', role: 'team_lead' },
        toState: 'UNDER_ASSESSMENT',
        claimMutation: (c) => { c.assigned_assessor_id = 'ASS-001'; },
      },
      {
        description: 'Assessor approves after receiving discharge summary',
        actor: { user_id: 'U003', role: 'assessor' },
        toState: 'APPROVED',
        claimMutation: (c) => {
          c.assessment_report = 'All documents now complete including discharge summary.';
          c.approved_amount = 5000;
        },
      },
      {
        description: 'Finance initiates payment',
        actor: { user_id: 'U004', role: 'finance' },
        toState: 'PAYMENT_INITIATED',
      },
      {
        description: 'Finance closes claim',
        actor: { user_id: 'U004', role: 'finance' },
        toState: 'CLOSED',
        claimMutation: (c) => { c.payment_reference = 'PAY-REF-20240615'; },
      },
    ],
  },

  // ── Scenario 4: Invalid Transition ────────────────────────────────────────
  {
    id: 'S4',
    name: 'Invalid Transition',
    description: 'Attempt SUBMITTED → APPROVED — must fail with specific error',
    initialClaim: () => baseClaim('CLM-S4-001'),
    steps: [
      {
        description: 'Attempt invalid jump from SUBMITTED directly to APPROVED',
        actor: { user_id: 'U999', role: 'assessor' },
        toState: 'APPROVED',
        expectError: 'InvalidTransitionError',
        notes: 'This should fail — no direct path exists',
      },
    ],
  },

  // ── Scenario 5: Unauthorized Role ─────────────────────────────────────────
  {
    id: 'S5',
    name: 'Unauthorized Role',
    description: 'Finance attempts document_clerk transition — must be rejected',
    initialClaim: () => baseClaim('CLM-S5-001'),
    steps: [
      {
        description: 'Finance (wrong role) tries to verify documents — must fail',
        actor: { user_id: 'U004', role: 'finance' },
        toState: 'DOCUMENTS_VERIFIED',
        expectError: 'UnauthorizedError',
        notes: 'Only document_clerk can verify documents',
      },
    ],
  },
];

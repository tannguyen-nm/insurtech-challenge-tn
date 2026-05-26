import { WorkflowEngine } from '../src/lib/engine';
import {
  InvalidTransitionError,
  UnauthorizedError,
  PreconditionFailedError,
  MaxCyclesExceededError,
} from '../src/types';
import type { Claim, WorkflowConfig } from '../src/types';
import workflowConfig from '../src/config/workflow.json';

const config = workflowConfig as WorkflowConfig;

function makeClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    claim_id: 'CLM-TEST-001',
    current_state: 'SUBMITTED',
    documents: [
      { name: 'medical_receipt', status: 'COMPLETE' },
      { name: 'prescription', status: 'COMPLETE' },
    ],
    requested_amount: 5000,
    policy_annual_limit: 50000,
    pending_info_cycle_count: 0,
    ...overrides,
  };
}

const DOC_CLERK = { user_id: 'U001', role: 'document_clerk' };
const TEAM_LEAD = { user_id: 'U002', role: 'team_lead' };
const ASSESSOR = { user_id: 'U003', role: 'assessor' };
const FINANCE = { user_id: 'U004', role: 'finance' };
const SYSTEM = { user_id: 'SYS', role: 'system' };

// ── 1. Happy path: SUBMITTED → DOCUMENTS_VERIFIED ──────────────────────────
test('document_clerk can verify documents when all complete', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim();
  const result = engine.transition(claim, 'DOCUMENTS_VERIFIED', DOC_CLERK);
  expect(result.success).toBe(true);
  expect(claim.current_state).toBe('DOCUMENTS_VERIFIED');
});

// ── 2. Happy path: full lifecycle ──────────────────────────────────────────
test('full happy path completes to CLOSED via PAYMENT_INITIATED', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({ claim_id: 'CLM-HP-001' });

  engine.transition(claim, 'DOCUMENTS_VERIFIED', DOC_CLERK);
  claim.assigned_assessor_id = 'ASS-001';
  engine.transition(claim, 'UNDER_ASSESSMENT', TEAM_LEAD);
  claim.assessment_report = 'All good';
  claim.approved_amount = 5000;
  engine.transition(claim, 'APPROVED', ASSESSOR);
  engine.transition(claim, 'PAYMENT_INITIATED', FINANCE);
  claim.payment_reference = 'PAY-REF-001';
  engine.transition(claim, 'CLOSED', FINANCE);

  expect(claim.current_state).toBe('CLOSED');
});

// ── 3. Rejection path ──────────────────────────────────────────────────────
test('assessor can reject claim with report and rejection reason', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({ claim_id: 'CLM-REJ-001' });

  engine.transition(claim, 'DOCUMENTS_VERIFIED', DOC_CLERK);
  claim.assigned_assessor_id = 'ASS-001';
  engine.transition(claim, 'UNDER_ASSESSMENT', TEAM_LEAD);
  claim.assessment_report = 'Pre-existing condition found';
  claim.rejection_reason = 'Excluded under policy terms';
  engine.transition(claim, 'REJECTED', ASSESSOR);

  expect(claim.current_state).toBe('REJECTED');
});

// ── 4. REJECTED → CLOSED via member_acknowledged_rejection ────────────────
test('REJECTED → CLOSED passes when member acknowledged', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({ claim_id: 'CLM-ACK-001', current_state: 'REJECTED' });
  claim.appeal_acknowledged = true;
  engine.transition(claim, 'CLOSED', SYSTEM);
  expect(claim.current_state).toBe('CLOSED');
});

// ── 5. REJECTED → CLOSED via appeal_period_expired ────────────────────────
test('REJECTED → CLOSED passes when appeal period expired', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({ claim_id: 'CLM-EXP-001', current_state: 'REJECTED' });
  claim.appeal_period_expired = true;
  engine.transition(claim, 'CLOSED', SYSTEM);
  expect(claim.current_state).toBe('CLOSED');
});

// ── 6. any_of precondition fails when neither branch passes ───────────────
test('REJECTED → CLOSED fails when neither appeal condition met', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({ claim_id: 'CLM-NOACK-001', current_state: 'REJECTED' });
  expect(() => engine.transition(claim, 'CLOSED', SYSTEM)).toThrow(PreconditionFailedError);
});

// ── 7. InvalidTransitionError on illegal jump ────────────────────────────
test('SUBMITTED → APPROVED throws InvalidTransitionError', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim();
  expect(() => engine.transition(claim, 'APPROVED', ASSESSOR)).toThrow(InvalidTransitionError);
});

// ── 8. InvalidTransitionError includes valid targets ─────────────────────
test('InvalidTransitionError lists valid targets', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim();
  let err: InvalidTransitionError | undefined;
  try {
    engine.transition(claim, 'CLOSED', SYSTEM);
  } catch (e) {
    err = e as InvalidTransitionError;
  }
  expect(err).toBeInstanceOf(InvalidTransitionError);
  expect(err?.validTargets).toContain('DOCUMENTS_VERIFIED');
});

// ── 9. UnauthorizedError when wrong role ─────────────────────────────────
test('finance cannot verify documents — throws UnauthorizedError', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim();
  expect(() => engine.transition(claim, 'DOCUMENTS_VERIFIED', FINANCE)).toThrow(UnauthorizedError);
});

// ── 10. UnauthorizedError when wrong role 2 ──────────────────────────────
test('document_clerk cannot start assessment — throws UnauthorizedError', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({ current_state: 'DOCUMENTS_VERIFIED' });
  claim.assigned_assessor_id = 'ASS-001';
  expect(() => engine.transition(claim, 'UNDER_ASSESSMENT', DOC_CLERK)).toThrow(UnauthorizedError);
});

// ── 11. PreconditionFailedError: missing assessor ────────────────────────
test('DOCUMENTS_VERIFIED → UNDER_ASSESSMENT fails without assessor', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({ current_state: 'DOCUMENTS_VERIFIED' });
  expect(() => engine.transition(claim, 'UNDER_ASSESSMENT', TEAM_LEAD)).toThrow(PreconditionFailedError);
});

// ── 12. PreconditionFailedError: missing assessment report ───────────────
test('UNDER_ASSESSMENT → APPROVED fails without assessment report', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({ current_state: 'UNDER_ASSESSMENT', assigned_assessor_id: 'ASS-1' });
  expect(() => engine.transition(claim, 'APPROVED', ASSESSOR)).toThrow(PreconditionFailedError);
});

// ── 13. PreconditionFailedError: incomplete documents ────────────────────
test('SUBMITTED → DOCUMENTS_VERIFIED fails with missing documents', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({
    documents: [
      { name: 'medical_receipt', status: 'MISSING' },
      { name: 'prescription', status: 'COMPLETE' },
    ],
  });
  expect(() => engine.transition(claim, 'DOCUMENTS_VERIFIED', DOC_CLERK)).toThrow(PreconditionFailedError);
});

// ── 14. MaxCyclesExceededError after 3 PENDING_INFO cycles ───────────────
test('4th PENDING_INFO request throws MaxCyclesExceededError', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({ current_state: 'UNDER_ASSESSMENT', pending_info_cycle_count: 3 });
  claim.missing_info_description = 'Need more docs';
  expect(() => engine.transition(claim, 'PENDING_INFO', ASSESSOR)).toThrow(MaxCyclesExceededError);
});

// ── 15. Cycle counter increments on successful PENDING_INFO ──────────────
test('pending_info_cycle_count increments after each PENDING_INFO transition', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({ claim_id: 'CLM-CYCLE-001' });

  engine.transition(claim, 'DOCUMENTS_VERIFIED', DOC_CLERK);
  claim.assigned_assessor_id = 'ASS-1';
  engine.transition(claim, 'UNDER_ASSESSMENT', TEAM_LEAD);
  claim.missing_info_description = 'Need discharge summary';
  engine.transition(claim, 'PENDING_INFO', ASSESSOR);

  expect(claim.pending_info_cycle_count).toBe(1);
});

// ── 16. PreconditionFailedError: approved_amount exceeds policy limit ────
test('UNDER_ASSESSMENT → APPROVED fails when approved_amount exceeds policy limit', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({
    current_state: 'UNDER_ASSESSMENT',
    requested_amount: 5000,
    policy_annual_limit: 3000,
  });
  claim.assessment_report = 'All clear';
  claim.approved_amount = 4000; // exceeds limit of 3000
  expect(() => engine.transition(claim, 'APPROVED', ASSESSOR)).toThrow(PreconditionFailedError);
});

// ── 17. amount_within_policy_limit uses approved_amount over requested ────
test('UNDER_ASSESSMENT → APPROVED passes when approved_amount within limit despite high requested_amount', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({
    current_state: 'UNDER_ASSESSMENT',
    requested_amount: 60000, // exceeds limit
    policy_annual_limit: 50000,
  });
  claim.assessment_report = 'Partial approval';
  claim.approved_amount = 40000; // within limit
  const result = engine.transition(claim, 'APPROVED', ASSESSOR);
  expect(result.success).toBe(true);
  expect(claim.current_state).toBe('APPROVED');
});

// ── 18. Side effect: create_payment_request sets payment_request_id ──────
test('APPROVED side effect creates payment_request_id', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({ current_state: 'UNDER_ASSESSMENT' });
  claim.assessment_report = 'All clear';
  claim.approved_amount = 5000;
  engine.transition(claim, 'APPROVED', ASSESSOR);
  expect(claim.payment_request_id).toBeDefined();
  expect(claim.payment_request_id).toMatch(/^PAY-REQ-/);
});

// ── 19. Side effect: log_timestamp sets assessment_start_time ────────────
test('UNDER_ASSESSMENT side effect sets assessment_start_time', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({ current_state: 'DOCUMENTS_VERIFIED' });
  claim.assigned_assessor_id = 'ASS-1';
  engine.transition(claim, 'UNDER_ASSESSMENT', TEAM_LEAD);
  expect(claim.assessment_start_time).toBeDefined();
});

// ── 20. Audit trail appended per transition ──────────────────────────────
test('audit trail records all transitions for claim', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({ claim_id: 'CLM-AUDIT-001' });
  engine.transition(claim, 'DOCUMENTS_VERIFIED', DOC_CLERK);
  claim.assigned_assessor_id = 'ASS-1';
  engine.transition(claim, 'UNDER_ASSESSMENT', TEAM_LEAD);

  const trail = engine.getAuditTrail('CLM-AUDIT-001');
  expect(trail).toHaveLength(2);
  expect(trail[0].from_state).toBe('SUBMITTED');
  expect(trail[0].to_state).toBe('DOCUMENTS_VERIFIED');
  expect(trail[1].from_state).toBe('DOCUMENTS_VERIFIED');
  expect(trail[1].to_state).toBe('UNDER_ASSESSMENT');
});

// ── 21. Audit trail filtered by claim_id ─────────────────────────────────
test('getAuditTrail returns only entries for specified claim', () => {
  const engine = new WorkflowEngine(config);
  const claimA = makeClaim({ claim_id: 'CLM-A' });
  const claimB = makeClaim({ claim_id: 'CLM-B' });
  engine.transition(claimA, 'DOCUMENTS_VERIFIED', DOC_CLERK);
  engine.transition(claimB, 'DOCUMENTS_VERIFIED', DOC_CLERK);

  const trailA = engine.getAuditTrail('CLM-A');
  expect(trailA).toHaveLength(1);
  expect(trailA[0].claim_id).toBe('CLM-A');
});

// ── 22. getValidTransitions respects current state ────────────────────────
test('getValidTransitions returns transitions from current state', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({ current_state: 'UNDER_ASSESSMENT' });
  const transitions = engine.getValidTransitions(claim);
  const targets = transitions.map((t) => t.to);
  expect(targets).toContain('APPROVED');
  expect(targets).toContain('REJECTED');
  expect(targets).toContain('PENDING_INFO');
  expect(targets).not.toContain('SUBMITTED');
});

// ── 23. getValidTransitions filtered by actor role ────────────────────────
test('getValidTransitions filters by actor role', () => {
  const engine = new WorkflowEngine(config);
  const claim = makeClaim({ current_state: 'UNDER_ASSESSMENT' });
  const transitions = engine.getValidTransitions(claim, FINANCE);
  expect(transitions).toHaveLength(0);
});

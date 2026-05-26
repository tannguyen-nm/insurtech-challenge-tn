export type ClaimState =
  | 'SUBMITTED'
  | 'DOCUMENTS_VERIFIED'
  | 'UNDER_ASSESSMENT'
  | 'PENDING_INFO'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAYMENT_INITIATED'
  | 'CLOSED';

export interface Document {
  name: string;
  status: 'COMPLETE' | 'MISSING' | 'PENDING';
}

export interface Claim {
  claim_id: string;
  current_state: ClaimState;
  documents: Document[];
  assigned_assessor_id?: string;
  assessment_report?: string;
  requested_amount: number;
  policy_annual_limit: number;
  approved_amount?: number;
  rejection_reason?: string;
  missing_info_description?: string;
  payment_reference?: string;
  payment_request_id?: string;
  appeal_acknowledged?: boolean;
  appeal_period_expired?: boolean;
  assessment_start_time?: string;
  pending_info_cycle_count: number;
}

export interface Actor {
  user_id: string;
  role: string;
}

export interface PreconditionDef {
  type: string;
  any_of?: PreconditionDef[];
}

export interface SideEffectDef {
  type: string;
  target?: string;
  template?: string;
  field?: string;
}

export interface TransitionDef {
  from: ClaimState;
  to: ClaimState;
  label?: string;
  preconditions: PreconditionDef[];
  side_effects: SideEffectDef[];
  authorized_roles: string[];
}

export interface WorkflowConfig {
  states: ClaimState[];
  transitions: TransitionDef[];
}

export interface AuditEntry {
  id: string;
  claim_id: string;
  timestamp: string;
  from_state: ClaimState;
  to_state: ClaimState;
  triggered_by: { user_id: string; role: string };
  notes?: string;
  side_effects_executed: string[];
}

export interface TransitionResult {
  success: true;
  claim: Claim;
  audit_entry: AuditEntry;
}

export class InvalidTransitionError extends Error {
  readonly from: string;
  readonly to: string;
  readonly validTargets: string[];
  constructor(from: string, to: string, validTargets: string[]) {
    super(
      `No transition from ${from} to ${to}. Valid transitions from ${from}: [${validTargets.join(', ') || 'none'}].`
    );
    this.name = 'InvalidTransitionError';
    this.from = from;
    this.to = to;
    this.validTargets = validTargets;
  }
}

export class UnauthorizedError extends Error {
  constructor(role: string, transition: string, allowedRoles: string[]) {
    super(
      `Role "${role}" is not authorized for transition ${transition}. Authorized roles: [${allowedRoles.join(', ')}].`
    );
    this.name = 'UnauthorizedError';
  }
}

export class PreconditionFailedError extends Error {
  readonly condition: string;
  constructor(condition: string, detail?: string) {
    super(
      `Precondition failed: "${condition}"${detail ? ` — ${detail}` : ''}.`
    );
    this.name = 'PreconditionFailedError';
    this.condition = condition;
  }
}

export class MaxCyclesExceededError extends Error {
  constructor() {
    super(
      'Maximum information requests exceeded — escalate to team lead'
    );
    this.name = 'MaxCyclesExceededError';
  }
}

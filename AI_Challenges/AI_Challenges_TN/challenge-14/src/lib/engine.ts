import type {
  Actor,
  AuditEntry,
  Claim,
  ClaimState,
  TransitionDef,
  TransitionResult,
  WorkflowConfig,
} from '../types';
import {
  InvalidTransitionError,
  MaxCyclesExceededError,
  UnauthorizedError,
} from '../types';
import { evaluatePrecondition } from './preconditions';
import { executeSideEffect } from './sideEffects';

const MAX_PENDING_INFO_CYCLES = 3;

let _auditIdCounter = 0;
function nextAuditId(): string {
  return `AUD-${String(++_auditIdCounter).padStart(6, '0')}`;
}

export class WorkflowEngine {
  private readonly config: WorkflowConfig;
  private readonly auditTrail: AuditEntry[] = [];

  constructor(config: WorkflowConfig) {
    this.config = config;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  transition(
    claim: Claim,
    toState: ClaimState,
    actor: Actor,
    notes?: string
  ): TransitionResult {
    const from = claim.current_state;

    // 1. Find transition definition
    const def = this.findTransition(from, toState);
    if (!def) {
      const validTargets = this.config.transitions
        .filter((t) => t.from === from)
        .map((t) => t.to);
      throw new InvalidTransitionError(from, toState, validTargets);
    }

    // 2. Role authorization
    if (!def.authorized_roles.includes(actor.role)) {
      throw new UnauthorizedError(actor.role, `${from} → ${toState}`, def.authorized_roles);
    }

    // 3. Cycle detection — check BEFORE executing
    if (from === 'UNDER_ASSESSMENT' && toState === 'PENDING_INFO') {
      if (claim.pending_info_cycle_count >= MAX_PENDING_INFO_CYCLES) {
        throw new MaxCyclesExceededError();
      }
    }

    // 4. Preconditions
    for (const precondition of def.preconditions) {
      evaluatePrecondition(precondition, claim);
    }

    // 5. Side effects (mutate claim, collect logs)
    const effectLogs: string[] = [];
    for (const effect of def.side_effects) {
      effectLogs.push(executeSideEffect(effect, claim));
    }

    // 6. Cycle count increment AFTER successful preconditions
    if (from === 'UNDER_ASSESSMENT' && toState === 'PENDING_INFO') {
      claim.pending_info_cycle_count++;
    }

    // 7. State transition
    claim.current_state = toState;

    // 8. Immutable audit entry (append only)
    const entry: AuditEntry = {
      id: nextAuditId(),
      claim_id: claim.claim_id,
      timestamp: new Date().toISOString(),
      from_state: from,
      to_state: toState,
      triggered_by: { user_id: actor.user_id, role: actor.role },
      notes,
      side_effects_executed: effectLogs,
    };
    this.auditTrail.push(entry);

    return { success: true, claim, audit_entry: entry };
  }

  getValidTransitions(claim: Claim, actor?: Actor): TransitionDef[] {
    return this.config.transitions.filter(
      (t) =>
        t.from === claim.current_state &&
        (!actor || t.authorized_roles.includes(actor.role))
    );
  }

  getAuditTrail(claimId: string): AuditEntry[] {
    return this.auditTrail.filter((e) => e.claim_id === claimId);
  }

  getAllTransitions(): TransitionDef[] {
    return this.config.transitions;
  }

  getStates(): ClaimState[] {
    return this.config.states;
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private findTransition(from: ClaimState, to: ClaimState): TransitionDef | undefined {
    return this.config.transitions.find((t) => t.from === from && t.to === to);
  }
}

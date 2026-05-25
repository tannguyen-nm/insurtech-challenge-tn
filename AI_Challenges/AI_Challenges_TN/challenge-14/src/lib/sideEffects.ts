import type { Claim, SideEffectDef } from '../types';

type EffectExecutor = (claim: Claim, def: SideEffectDef) => string;

function interpolate(template: string, claim: Claim): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = (claim as unknown as Record<string, unknown>)[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

const registry: Record<string, EffectExecutor> = {
  notify: (claim, def) => {
    const msg = interpolate(def.template ?? '', claim);
    const log = `[NOTIFY → ${def.target}] ${msg}`;
    console.log(log);
    return log;
  },

  log_timestamp: (claim, def) => {
    const ts = new Date().toISOString();
    if (def.field) (claim as unknown as Record<string, string>)[def.field] = ts;
    const log = `[TIMESTAMP] Set ${def.field} = ${ts}`;
    console.log(log);
    return log;
  },

  create_payment_request: (claim) => {
    claim.payment_request_id = `PAY-REQ-${claim.claim_id}-${Date.now()}`;
    const log = `[PAYMENT_REQUEST] Created ${claim.payment_request_id}`;
    console.log(log);
    return log;
  },

  trigger_payment_system: (claim) => {
    const log = `[PAYMENT_SYSTEM] Payment triggered for claim ${claim.claim_id}, request ${claim.payment_request_id}`;
    console.log(log);
    return log;
  },

  archive_claim: (claim) => {
    const log = `[ARCHIVE] Claim ${claim.claim_id} archived`;
    console.log(log);
    return log;
  },

  reset_assessment_timer: (claim) => {
    claim.assessment_start_time = undefined;
    const log = `[TIMER] Assessment timer reset for claim ${claim.claim_id}`;
    console.log(log);
    return log;
  },
};

export function executeSideEffect(def: SideEffectDef, claim: Claim): string {
  const executor = registry[def.type];
  if (!executor) {
    const log = `[SIDE_EFFECT] Unknown type "${def.type}" — skipped`;
    console.warn(log);
    return log;
  }
  return executor(claim, def);
}

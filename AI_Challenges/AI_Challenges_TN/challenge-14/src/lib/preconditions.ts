import type { PreconditionDef, Claim } from '../types';
import { PreconditionFailedError } from '../types';

type Evaluator = (claim: Claim) => { pass: boolean; detail?: string };

const registry: Record<string, Evaluator> = {
  all_documents_present: (claim) => {
    const missing = claim.documents.filter((d) => d.status !== 'COMPLETE').map((d) => d.name);
    return missing.length === 0
      ? { pass: true }
      : { pass: false, detail: `Missing/incomplete documents: ${missing.join(', ')}` };
  },

  assessor_assigned: (claim) => ({
    pass: !!claim.assigned_assessor_id,
    detail: claim.assigned_assessor_id ? undefined : 'No assessor has been assigned to this claim',
  }),

  assessment_report_complete: (claim) => ({
    pass: !!claim.assessment_report,
    detail: claim.assessment_report ? undefined : 'Assessment report has not been submitted',
  }),

  amount_within_policy_limit: (claim) => {
    const amount = claim.approved_amount ?? claim.requested_amount;
    return {
      pass: amount <= claim.policy_annual_limit,
      detail:
        amount > claim.policy_annual_limit
          ? `Approved amount ${amount} exceeds policy limit ${claim.policy_annual_limit}`
          : undefined,
    };
  },

  rejection_reason_provided: (claim) => ({
    pass: !!claim.rejection_reason,
    detail: claim.rejection_reason ? undefined : 'A rejection reason must be provided',
  }),

  missing_info_description_provided: (claim) => ({
    pass: !!claim.missing_info_description,
    detail: claim.missing_info_description ? undefined : 'A description of the missing information must be provided',
  }),

  payment_request_created: (claim) => ({
    pass: !!claim.payment_request_id,
    detail: claim.payment_request_id ? undefined : 'No payment request has been created',
  }),

  payment_confirmed: (claim) => ({
    pass: !!claim.payment_reference,
    detail: claim.payment_reference ? undefined : 'Payment has not been confirmed (no payment reference)',
  }),

  appeal_period_expired: (claim) => ({
    pass: !!claim.appeal_period_expired,
    detail: claim.appeal_period_expired ? undefined : 'Appeal period has not expired',
  }),

  member_acknowledged_rejection: (claim) => ({
    pass: !!claim.appeal_acknowledged,
    detail: claim.appeal_acknowledged ? undefined : 'Member has not acknowledged the rejection',
  }),
};

export function evaluatePrecondition(def: PreconditionDef, claim: Claim): void {
  if (def.type === 'any_of') {
    const subs = def.any_of ?? [];
    const anyPasses = subs.some((sub) => {
      try {
        evaluatePrecondition(sub, claim);
        return true;
      } catch {
        return false;
      }
    });
    if (!anyPasses) {
      const names = subs.map((s) => s.type).join(' OR ');
      throw new PreconditionFailedError(`any_of [${names}]`, 'None of the alternative conditions are met');
    }
    return;
  }

  const evaluator = registry[def.type];
  if (!evaluator) throw new PreconditionFailedError(def.type, `No evaluator registered for "${def.type}"`);

  const { pass, detail } = evaluator(claim);
  if (!pass) throw new PreconditionFailedError(def.type, detail);
}

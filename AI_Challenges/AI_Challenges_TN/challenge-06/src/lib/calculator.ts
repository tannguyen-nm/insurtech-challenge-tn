import type {
  Policy,
  Expense,
  CoverageResult,
  BenefitSummary,
  CalculatorOutput,
  DecisionType,
  BenefitType,
} from '../types';

interface CalcState {
  remainingAnnualLimit: Record<BenefitType, number>;
  remainingVisits: Record<string, number>;
  remainingSubYearLimit: Record<string, number>;
  remainingDeductible: number;
}

function initState(policy: Policy): CalcState {
  const remainingAnnualLimit = {} as Record<BenefitType, number>;
  const remainingVisits: Record<string, number> = {};
  const remainingSubYearLimit: Record<string, number> = {};

  for (const benefit of policy.benefits) {
    remainingAnnualLimit[benefit.type] = benefit.annual_limit;
    for (const sub of benefit.sub_benefits) {
      if (sub.visits_per_year !== undefined) {
        remainingVisits[sub.name] = sub.visits_per_year;
      }
      if (sub.limit_per_year !== undefined) {
        remainingSubYearLimit[sub.name] = sub.limit_per_year;
      }
    }
  }

  return {
    remainingAnnualLimit,
    remainingVisits,
    remainingSubYearLimit,
    remainingDeductible: policy.deductible,
  };
}

function matchesExclusion(diagnosis: string, exclusions: string[]): string | null {
  const diagLower = diagnosis.toLowerCase();
  for (const excl of exclusions) {
    const exclLower = excl.toLowerCase();
    // Full phrase match
    if (diagLower.includes(exclLower)) return excl;
    // Distinctive first-word match (avoids generic terms like "surgery", "injuries")
    const firstWord = exclLower.split(/\s+/)[0];
    if (firstWord.length >= 5 && diagLower.includes(firstWord)) return excl;
  }
  return null;
}

function processExpense(
  expense: Expense,
  policy: Policy,
  state: CalcState
): CoverageResult {
  const benefit = policy.benefits.find((b) => b.type === expense.benefit_type);

  if (!benefit) {
    return {
      expense_id: expense.expense_id,
      submitted_amount: expense.amount,
      covered_amount: 0,
      copay_amount: 0,
      deductible_applied: 0,
      member_pays: expense.amount,
      decision: 'DENIED_EXCLUSION',
      reason: `Benefit type ${expense.benefit_type} not covered by this policy.`,
      remaining_annual_limit: 0,
    };
  }

  const claimDate = new Date(expense.date);
  const effectiveDate = new Date(policy.effective_date);

  // 1. Waiting period check
  if (benefit.waiting_period_days) {
    const waitEnd = new Date(effectiveDate);
    waitEnd.setDate(waitEnd.getDate() + benefit.waiting_period_days);
    if (claimDate < waitEnd) {
      const endStr = waitEnd.toISOString().split('T')[0];
      return {
        expense_id: expense.expense_id,
        submitted_amount: expense.amount,
        covered_amount: 0,
        copay_amount: 0,
        deductible_applied: 0,
        member_pays: expense.amount,
        decision: 'DENIED_WAITING_PERIOD',
        reason: `Waiting period: ${benefit.waiting_period_days} days. Claim date ${expense.date} is within waiting period ending ${endStr}.`,
        remaining_annual_limit: state.remainingAnnualLimit[benefit.type],
      };
    }
  }

  // 2. Exclusion check
  const matchedExclusion = matchesExclusion(expense.diagnosis, policy.exclusions);
  if (matchedExclusion) {
    return {
      expense_id: expense.expense_id,
      submitted_amount: expense.amount,
      covered_amount: 0,
      copay_amount: 0,
      deductible_applied: 0,
      member_pays: expense.amount,
      decision: 'DENIED_EXCLUSION',
      reason: `Denied: diagnosis matches policy exclusion "${matchedExclusion}".`,
      remaining_annual_limit: state.remainingAnnualLimit[benefit.type],
    };
  }

  // 3. Annual limit check
  if (state.remainingAnnualLimit[benefit.type] <= 0) {
    return {
      expense_id: expense.expense_id,
      submitted_amount: expense.amount,
      covered_amount: 0,
      copay_amount: 0,
      deductible_applied: 0,
      member_pays: expense.amount,
      decision: 'DENIED_LIMIT_EXHAUSTED',
      reason: `Annual limit for ${benefit.type} fully exhausted (0 THB remaining).`,
      remaining_annual_limit: 0,
    };
  }

  // 4. Visit limit check
  const hasVisitTracking = expense.sub_benefit in state.remainingVisits;
  if (hasVisitTracking && state.remainingVisits[expense.sub_benefit] <= 0) {
    return {
      expense_id: expense.expense_id,
      submitted_amount: expense.amount,
      covered_amount: 0,
      copay_amount: 0,
      deductible_applied: 0,
      member_pays: expense.amount,
      decision: 'DENIED_LIMIT_EXHAUSTED',
      reason: `Visits per year for "${expense.sub_benefit}" exhausted (0 visits remaining).`,
      remaining_annual_limit: state.remainingAnnualLimit[benefit.type],
      remaining_visit_limit: 0,
    };
  }

  // 5. Sub-year limit check (limit_per_year on sub-benefit)
  const hasSubYearTracking = expense.sub_benefit in state.remainingSubYearLimit;
  if (hasSubYearTracking && state.remainingSubYearLimit[expense.sub_benefit] <= 0) {
    return {
      expense_id: expense.expense_id,
      submitted_amount: expense.amount,
      covered_amount: 0,
      copay_amount: 0,
      deductible_applied: 0,
      member_pays: expense.amount,
      decision: 'DENIED_LIMIT_EXHAUSTED',
      reason: `Annual sub-benefit limit for "${expense.sub_benefit}" exhausted (0 THB remaining).`,
      remaining_annual_limit: state.remainingAnnualLimit[benefit.type],
    };
  }

  const subBenefitDef = benefit.sub_benefits.find((s) => s.name === expense.sub_benefit);

  // 6. Deductible
  let eligible = expense.amount;
  let deductibleApplied = 0;
  if (state.remainingDeductible > 0) {
    deductibleApplied = Math.min(state.remainingDeductible, eligible);
    state.remainingDeductible -= deductibleApplied;
    eligible -= deductibleApplied;
  }

  if (eligible <= 0) {
    if (hasVisitTracking) state.remainingVisits[expense.sub_benefit]--;
    return {
      expense_id: expense.expense_id,
      submitted_amount: expense.amount,
      covered_amount: 0,
      copay_amount: 0,
      deductible_applied: deductibleApplied,
      member_pays: expense.amount,
      decision: 'DEDUCTIBLE_APPLIED',
      reason: `Entire expense absorbed by annual deductible (${deductibleApplied} THB applied). ${state.remainingDeductible} THB deductible remaining.`,
      remaining_annual_limit: state.remainingAnnualLimit[benefit.type],
      remaining_visit_limit: hasVisitTracking ? state.remainingVisits[expense.sub_benefit] : undefined,
    };
  }

  // 7. Per-visit / per-event / per-day sub-limit
  let subGross = eligible;
  let subLimitUsed = false;
  if (subBenefitDef) {
    const perVisit = subBenefitDef.limit_per_visit ?? subBenefitDef.limit_per_event ?? subBenefitDef.limit_per_day;
    if (perVisit !== undefined && subGross > perVisit) {
      subGross = perVisit;
      subLimitUsed = true;
    }
  }

  // 8. Copay
  const copayPct = benefit.copay_percentage;
  let copayAmount = 0;
  if (copayPct > 0) {
    copayAmount = Math.round(subGross * (copayPct / 100));
    if (benefit.copay_max_per_visit !== undefined) {
      copayAmount = Math.min(copayAmount, benefit.copay_max_per_visit);
    }
  }
  let coveredAfterCopay = subGross - copayAmount;

  // 9. Sub-year limit (limit_per_year on sub-benefit = max insurer payout for this sub per year)
  let subYearLimitUsed = false;
  if (hasSubYearTracking) {
    const subYearRemaining = state.remainingSubYearLimit[expense.sub_benefit];
    if (coveredAfterCopay > subYearRemaining) {
      coveredAfterCopay = subYearRemaining;
      subYearLimitUsed = true;
    }
  }

  // 10. Annual limit
  let annualLimitUsed = false;
  const annualRemaining = state.remainingAnnualLimit[benefit.type];
  if (coveredAfterCopay > annualRemaining) {
    coveredAfterCopay = annualRemaining;
    annualLimitUsed = true;
  }

  const coveredFinal = coveredAfterCopay;

  // Update state
  state.remainingAnnualLimit[benefit.type] -= coveredFinal;
  if (hasVisitTracking) state.remainingVisits[expense.sub_benefit]--;
  if (hasSubYearTracking) state.remainingSubYearLimit[expense.sub_benefit] -= coveredFinal;

  // Build reason and decision
  const memberPays = expense.amount - coveredFinal;
  let decision: DecisionType;
  const reasonParts: string[] = [];

  if (deductibleApplied > 0) reasonParts.push(`Deductible ${deductibleApplied} THB applied`);
  if (subLimitUsed) {
    const lim = subBenefitDef?.limit_per_visit ?? subBenefitDef?.limit_per_event ?? subBenefitDef?.limit_per_day;
    reasonParts.push(`Sub-benefit limit ${lim} THB/visit applied`);
  }
  if (copayAmount > 0) reasonParts.push(`${copayPct}% copay: ${copayAmount} THB`);
  if (subYearLimitUsed) reasonParts.push(`Sub-benefit annual limit reached`);
  if (annualLimitUsed) reasonParts.push(`Annual limit: covered up to remaining ${annualRemaining} THB`);

  if (coveredFinal === expense.amount && reasonParts.length === 0) {
    decision = 'COVERED';
  } else if (coveredFinal > 0) {
    decision = 'PARTIALLY_COVERED';
  } else {
    decision = 'DENIED_LIMIT_EXHAUSTED';
  }

  const reason =
    reasonParts.length > 0
      ? reasonParts.join('. ') + `. Covered: ${coveredFinal} THB. Member pays: ${memberPays} THB.`
      : `Expense fully covered by policy. Covered: ${coveredFinal} THB.`;

  return {
    expense_id: expense.expense_id,
    submitted_amount: expense.amount,
    covered_amount: coveredFinal,
    copay_amount: copayAmount,
    deductible_applied: deductibleApplied,
    member_pays: memberPays,
    decision,
    reason,
    remaining_annual_limit: state.remainingAnnualLimit[benefit.type],
    remaining_visit_limit: hasVisitTracking
      ? state.remainingVisits[expense.sub_benefit]
      : undefined,
  };
}

export function calculateCoverage(policy: Policy, expenses: Expense[]): CalculatorOutput {
  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
  const state = initState(policy);

  const results: CoverageResult[] = sorted.map((exp) => processExpense(exp, policy, state));

  const summary: BenefitSummary[] = policy.benefits.map((b) => ({
    benefit_type: b.type,
    annual_limit: b.annual_limit,
    used: b.annual_limit - state.remainingAnnualLimit[b.type],
    remaining: state.remainingAnnualLimit[b.type],
  }));

  const total_submitted = expenses.reduce((s, e) => s + e.amount, 0);
  const total_covered = results.reduce((s, r) => s + r.covered_amount, 0);
  const total_member_pays = results.reduce((s, r) => s + r.member_pays, 0);

  return { results, summary, total_submitted, total_covered, total_member_pays };
}

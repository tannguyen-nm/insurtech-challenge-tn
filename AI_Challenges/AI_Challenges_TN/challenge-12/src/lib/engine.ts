import type {
  Claim,
  CountryConfig,
  OverallStatus,
  Rule,
  RuleDiffItem,
  RuleResult,
  RuleType,
  ValidationResult,
} from '../types';

// ── Business-day helpers ──────────────────────────────────────────────────────

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function businessDaysBetween(from: string, to: string): number {
  const start = new Date(from);
  const end = new Date(to);
  let days = 0;
  const cur = new Date(start);
  cur.setUTCDate(cur.getUTCDate() + 1);
  while (cur <= end) {
    if (!isWeekend(cur)) days++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

function calendarDaysBetween(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.floor(ms / 86400000);
}

// ── Rule filters ──────────────────────────────────────────────────────────────

function isRuleActive(rule: Rule, claimDate: string): boolean {
  if (rule.effective_date > claimDate) return false;
  if (rule.expiry_date && rule.expiry_date <= claimDate) return false;
  return true;
}

// ── Validators ────────────────────────────────────────────────────────────────

function validateDocumentRequirement(rule: Rule, claim: Claim, countryName: string): RuleResult {
  const params = rule.parameters as {
    required_documents: string[];
    applies_to: string[];
  };

  if (!params.applies_to.includes(claim.claim_type)) {
    return {
      rule_id: rule.rule_id,
      rule_type: rule.rule_type,
      description: rule.description,
      status: 'SKIPPED',
      message: `Rule ${rule.rule_id} does not apply to ${claim.claim_type} claims.`,
    };
  }

  const missing = params.required_documents.filter((doc) => !claim.documents.includes(doc));
  if (missing.length === 0) {
    return {
      rule_id: rule.rule_id,
      rule_type: rule.rule_type,
      description: rule.description,
      status: 'PASS',
      message: `All required documents present for ${claim.claim_type} claim in ${countryName}.`,
    };
  }

  const missingList = missing.map((d) => d.replace(/_/g, ' ')).join(', ');
  return {
    rule_id: rule.rule_id,
    rule_type: rule.rule_type,
    description: rule.description,
    status: 'FAIL',
    message: `Missing required document(s): ${missingList} for ${claim.claim_type} claim in ${countryName} (Rule ${rule.rule_id}).`,
    remediation: `Submit the following document(s) to proceed: ${missingList}.`,
  };
}

function validateSlaCheck(rule: Rule, claim: Claim, countryName: string): RuleResult {
  const params = rule.parameters as { max_business_days: Record<string, number> };
  const maxDays = params.max_business_days[claim.claim_type];

  if (maxDays === undefined) {
    return {
      rule_id: rule.rule_id,
      rule_type: rule.rule_type,
      description: rule.description,
      status: 'SKIPPED',
      message: `No SLA defined for ${claim.claim_type} in ${countryName}.`,
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const elapsed = claim.processing_days ?? businessDaysBetween(claim.submission_date, today);

  if (elapsed <= maxDays) {
    return {
      rule_id: rule.rule_id,
      rule_type: rule.rule_type,
      description: rule.description,
      status: 'PASS',
      message: `SLA met: ${elapsed} business days elapsed, max ${maxDays} for ${claim.claim_type} in ${countryName}.`,
    };
  }

  return {
    rule_id: rule.rule_id,
    rule_type: rule.rule_type,
    description: rule.description,
    status: 'FAIL',
    message: `SLA exceeded: ${elapsed} business days elapsed, max ${maxDays} for ${claim.claim_type} in ${countryName} (Rule ${rule.rule_id}).`,
    remediation: `Expedite claim processing immediately. SLA of ${maxDays} business days has been exceeded by ${elapsed - maxDays} days.`,
  };
}

function validateWaitingPeriod(rule: Rule, claim: Claim, countryName: string): RuleResult {
  const params = rule.parameters as { general_days: number; pre_existing_days: number };
  const required = claim.is_pre_existing ? params.pre_existing_days : params.general_days;
  const elapsed = calendarDaysBetween(claim.policy_start_date, claim.submission_date);
  const conditionLabel = claim.is_pre_existing ? 'pre-existing condition' : 'general';

  if (elapsed >= required) {
    return {
      rule_id: rule.rule_id,
      rule_type: rule.rule_type,
      description: rule.description,
      status: 'PASS',
      message: `Waiting period met: ${elapsed} days elapsed since policy start (${required} required for ${conditionLabel}) in ${countryName}.`,
    };
  }

  const shortfall = required - elapsed;
  return {
    rule_id: rule.rule_id,
    rule_type: rule.rule_type,
    description: rule.description,
    status: 'FAIL',
    message: `Waiting period not met: policy started ${claim.policy_start_date}, claim submitted ${claim.submission_date} — ${elapsed} days elapsed, ${required} required for ${conditionLabel} in ${countryName} (Rule ${rule.rule_id}).`,
    remediation: `Resubmit claim after ${shortfall} more days (from ${claim.submission_date}).`,
  };
}

function validateDataMasking(rule: Rule, claim: Claim, countryName: string): RuleResult {
  const params = rule.parameters as { field: string; strategy: string; pattern: string };
  const value = (claim as unknown as Record<string, unknown>)[params.field] as string | undefined;

  if (value === undefined || value === null) {
    return {
      rule_id: rule.rule_id,
      rule_type: rule.rule_type,
      description: rule.description,
      status: 'SKIPPED',
      message: `Field "${params.field}" not present in claim — masking check skipped.`,
    };
  }

  const regex = new RegExp(params.pattern);
  if (regex.test(value)) {
    return {
      rule_id: rule.rule_id,
      rule_type: rule.rule_type,
      description: rule.description,
      status: 'PASS',
      message: `Data masking compliant: "${params.field}" is properly masked in ${countryName}.`,
    };
  }

  const strategyDesc: Record<string, string> = {
    last_4_digits: 'show last 4 digits only (e.g. *****1234)',
    first_last_initial: 'show first and last initial only (e.g. J. Smith J.)',
    first_letter_last_digit: 'show first letter and last digit only (e.g. A****7)',
  };

  return {
    rule_id: rule.rule_id,
    rule_type: rule.rule_type,
    description: rule.description,
    status: 'FAIL',
    message: `Data masking violation: "${params.field}" is not properly masked in ${countryName} (Rule ${rule.rule_id}). Expected format: ${strategyDesc[params.strategy] ?? params.strategy}.`,
    remediation: `Mask the "${params.field}" field using strategy "${params.strategy}" before including in reports.`,
  };
}

function validateCoverageMandate(rule: Rule, claim: Claim, countryName: string): RuleResult {
  if (rule.always_pass) {
    return {
      rule_id: rule.rule_id,
      rule_type: rule.rule_type,
      description: rule.description,
      status: 'PASS',
      message: `Coverage mandate "${rule.parameters.mandate}" is declared and enforced by policy in ${countryName}.`,
    };
  }

  const params = rule.parameters as {
    mandate: string;
    applies_to: string[];
    condition?: string;
  };

  if (params.applies_to && !params.applies_to.includes(claim.claim_type)) {
    return {
      rule_id: rule.rule_id,
      rule_type: rule.rule_type,
      description: rule.description,
      status: 'SKIPPED',
      message: `Coverage mandate does not apply to ${claim.claim_type} claims.`,
    };
  }

  // VN maternity mandate: policy must be > 12 months
  if (params.mandate === 'maternity_long_policy' && claim.claim_type === 'MATERNITY') {
    const months = claim.policy_duration_months ?? 0;
    if (months >= 12) {
      return {
        rule_id: rule.rule_id,
        rule_type: rule.rule_type,
        description: rule.description,
        status: 'PASS',
        message: `Maternity coverage mandate met: policy duration is ${months} months (≥12 required) in ${countryName}.`,
      };
    }
    return {
      rule_id: rule.rule_id,
      rule_type: rule.rule_type,
      description: rule.description,
      status: 'FAIL',
      message: `Maternity coverage mandate not met: policy duration is ${months} months, but ${countryName} requires ≥12 months for maternity coverage (Rule ${rule.rule_id}).`,
      remediation: `Maternity claims require a policy of at least 12 months duration. Current policy is ${months} months.`,
    };
  }

  return {
    rule_id: rule.rule_id,
    rule_type: rule.rule_type,
    description: rule.description,
    status: 'PASS',
    message: `Coverage mandate "${params.mandate}" satisfied for ${claim.claim_type} in ${countryName}.`,
  };
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

const VALIDATORS: Record<RuleType, (rule: Rule, claim: Claim, country: string) => RuleResult> = {
  document_requirement: validateDocumentRequirement,
  sla_check: validateSlaCheck,
  waiting_period: validateWaitingPeriod,
  data_masking: validateDataMasking,
  coverage_mandate: validateCoverageMandate,
};

// ── Public API ────────────────────────────────────────────────────────────────

export function validateClaim(claim: Claim, config: CountryConfig): ValidationResult {
  const activeRules = config.rules.filter((r) => isRuleActive(r, claim.submission_date));
  const results: RuleResult[] = activeRules.map((rule) =>
    VALIDATORS[rule.rule_type](rule, claim, config.country_name)
  );

  const failing = results.filter((r) => r.status === 'FAIL');
  const passing = results.filter((r) => r.status === 'PASS');

  let overall_status: OverallStatus;
  if (failing.length === 0) {
    overall_status = 'COMPLIANT';
  } else if (passing.length === 0) {
    overall_status = 'NON_COMPLIANT';
  } else {
    overall_status = 'PARTIALLY_COMPLIANT';
  }

  return {
    claim_id: claim.claim_id,
    country: config.country,
    country_name: config.country_name,
    overall_status,
    rules: results,
    applied_date: claim.submission_date,
  };
}

export function diffCountryRules(configA: CountryConfig, configB: CountryConfig): RuleDiffItem[] {
  const allTypes = new Set<RuleType>([
    ...configA.rules.map((r) => r.rule_type),
    ...configB.rules.map((r) => r.rule_type),
  ]);

  const diffs: RuleDiffItem[] = [];

  for (const ruleType of allTypes) {
    const rulesA = configA.rules.filter((r) => r.rule_type === ruleType);
    const rulesB = configB.rules.filter((r) => r.rule_type === ruleType);

    if (rulesA.length === 0) {
      rulesB.forEach((r) =>
        diffs.push({
          rule_type: ruleType,
          rule_id_b: r.rule_id,
          status: 'only_in_b',
          description: `"${r.description}" exists only in ${configB.country_name}`,
        })
      );
    } else if (rulesB.length === 0) {
      rulesA.forEach((r) =>
        diffs.push({
          rule_type: ruleType,
          rule_id_a: r.rule_id,
          status: 'only_in_a',
          description: `"${r.description}" exists only in ${configA.country_name}`,
        })
      );
    } else {
      // Compare parameters of matching rule types
      rulesA.forEach((ruleA) => {
        const ruleB = rulesB[0]; // compare first match per type for clarity
        const paramDiff: Record<string, { a: unknown; b: unknown }> = {};
        const allKeys = new Set([
          ...Object.keys(ruleA.parameters),
          ...Object.keys(ruleB.parameters),
        ]);
        for (const key of allKeys) {
          const aVal = ruleA.parameters[key];
          const bVal = ruleB.parameters[key];
          if (JSON.stringify(aVal) !== JSON.stringify(bVal)) {
            paramDiff[key] = { a: aVal, b: bVal };
          }
        }

        if (Object.keys(paramDiff).length === 0) {
          diffs.push({
            rule_type: ruleType,
            rule_id_a: ruleA.rule_id,
            rule_id_b: ruleB.rule_id,
            status: 'same',
            description: `${ruleType} rules are equivalent between ${configA.country_name} and ${configB.country_name}`,
          });
        } else {
          diffs.push({
            rule_type: ruleType,
            rule_id_a: ruleA.rule_id,
            rule_id_b: ruleB.rule_id,
            status: 'differs',
            description: `${ruleType} parameters differ between ${configA.country_name} and ${configB.country_name}`,
            diff: paramDiff,
          });
        }
      });

      // Remaining rules in B not yet compared
      if (rulesB.length > 1) {
        rulesB.slice(1).forEach((r) =>
          diffs.push({
            rule_type: ruleType,
            rule_id_b: r.rule_id,
            status: 'only_in_b',
            description: `"${r.description}" exists only in ${configB.country_name}`,
          })
        );
      }
      if (rulesA.length > 1) {
        rulesA.slice(1).forEach((r) =>
          diffs.push({
            rule_type: ruleType,
            rule_id_a: r.rule_id,
            status: 'only_in_a',
            description: `"${r.description}" exists only in ${configA.country_name}`,
          })
        );
      }
    }
  }

  return diffs;
}

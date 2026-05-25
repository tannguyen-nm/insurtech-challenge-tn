import type { Claim, RuleFlag } from './types.js'
import {
  SEVERITY, BUNDLES, VALID_DX_PROCS, CLUSTER_LOW, CLUSTER_HIGH,
  isSurgical, WEEKEND_RATE_THRESHOLD, PHANTOM_THRESHOLD,
  MIN_PROC_SAMPLES, RAPID_WINDOW_DAYS,
} from './constants.js'

function flag(claim_id: string, rule: string, triggered: boolean, evidence: string): RuleFlag {
  return { claim_id, rule, triggered, severity: SEVERITY[rule] ?? 1, evidence }
}

// Rule 1: Duplicate claim — same member, provider, date, diagnosis
export function ruleDuplicate(claims: Claim[]): RuleFlag[] {
  const counts = new Map<string, string[]>()
  for (const c of claims) {
    const key = `${c.member_id}|${c.provider_id}|${c.claim_date}|${c.diagnosis_code}`
    const arr = counts.get(key) ?? []
    arr.push(c.claim_id)
    counts.set(key, arr)
  }
  return claims.map(c => {
    const key = `${c.member_id}|${c.provider_id}|${c.claim_date}|${c.diagnosis_code}`
    const group = counts.get(key) ?? []
    const triggered = group.length > 1
    return flag(c.claim_id, 'duplicate', triggered,
      triggered ? `Duplicate group: ${group.join(', ')}` : '')
  })
}

// Rule 2: Rapid re-submission — same member+diagnosis within 7 days
export function ruleRapidResubmission(claims: Claim[]): RuleFlag[] {
  // Group by member+diagnosis, sort by date
  const groups = new Map<string, Claim[]>()
  for (const c of claims) {
    const key = `${c.member_id}|${c.diagnosis_code}`
    const arr = groups.get(key) ?? []
    arr.push(c)
    groups.set(key, arr)
  }
  for (const arr of groups.values()) arr.sort((a, b) => a.claim_date.localeCompare(b.claim_date))

  const triggered = new Map<string, string>()
  for (const arr of groups.values()) {
    for (let i = 1; i < arr.length; i++) {
      const prev = new Date(arr[i - 1].claim_date)
      const curr = new Date(arr[i].claim_date)
      const daysDiff = (curr.getTime() - prev.getTime()) / 86_400_000
      if (daysDiff <= RAPID_WINDOW_DAYS) {
        triggered.set(arr[i].claim_id,
          `Re-submission ${daysDiff.toFixed(0)}d after ${arr[i-1].claim_id} (same member+diagnosis)`)
      }
    }
  }
  return claims.map(c => flag(c.claim_id, 'rapid_resubmission', triggered.has(c.claim_id), triggered.get(c.claim_id) ?? ''))
}

// Rule 3: Upcoding — amount > mean + 2*std per procedure_code
export function ruleUpcoding(claims: Claim[]): RuleFlag[] {
  // Build stats per procedure code
  const procAmounts = new Map<string, number[]>()
  for (const c of claims) {
    for (const proc of c.procedure_codes) {
      const arr = procAmounts.get(proc) ?? []
      arr.push(c.submitted_amount)
      procAmounts.set(proc, arr)
    }
  }
  const procStats = new Map<string, { mean: number; std: number }>()
  for (const [proc, amounts] of procAmounts) {
    if (amounts.length < MIN_PROC_SAMPLES) continue
    const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length
    const variance = amounts.reduce((s, v) => s + (v - mean) ** 2, 0) / amounts.length
    procStats.set(proc, { mean, std: Math.sqrt(variance) })
  }

  return claims.map(c => {
    for (const proc of c.procedure_codes) {
      const stats = procStats.get(proc)
      if (!stats) continue
      const threshold = stats.mean + 2 * stats.std
      if (c.submitted_amount > threshold) {
        return flag(c.claim_id, 'upcoding', true,
          `Amount $${c.submitted_amount.toFixed(2)} > mean+2σ ($${threshold.toFixed(2)}) for procedure ${proc}`)
      }
    }
    return flag(c.claim_id, 'upcoding', false, '')
  })
}

// Rule 4: Unbundling — claim has ALL individual codes for a known bundle
export function ruleUnbundling(claims: Claim[]): RuleFlag[] {
  return claims.map(c => {
    const procs = new Set(c.procedure_codes)
    for (const [bundleName, components] of Object.entries(BUNDLES)) {
      if (components.every(code => procs.has(code))) {
        return flag(c.claim_id, 'unbundling', true,
          `Contains all components of ${bundleName}: ${components.join(', ')}`)
      }
    }
    return flag(c.claim_id, 'unbundling', false, '')
  })
}

// Rule 5: Phantom billing — provider with > 30 claims on a single day
export function rulePhantomBilling(claims: Claim[]): RuleFlag[] {
  const dailyCounts = new Map<string, string[]>()
  for (const c of claims) {
    const key = `${c.provider_id}|${c.claim_date}`
    const arr = dailyCounts.get(key) ?? []
    arr.push(c.claim_id)
    dailyCounts.set(key, arr)
  }
  return claims.map(c => {
    const key = `${c.provider_id}|${c.claim_date}`
    const count = (dailyCounts.get(key) ?? []).length
    const triggered = count > PHANTOM_THRESHOLD
    return flag(c.claim_id, 'phantom_billing', triggered,
      triggered ? `Provider ${c.provider_id} submitted ${count} claims on ${c.claim_date}` : '')
  })
}

// Rule 6: Weekend anomaly — surgical procedure on weekend, provider weekend rate < 5%
export function ruleWeekendAnomaly(claims: Claim[]): RuleFlag[] {
  // Compute each provider's weekend rate
  const providerTotal = new Map<string, number>()
  const providerWeekend = new Map<string, number>()
  for (const c of claims) {
    providerTotal.set(c.provider_id, (providerTotal.get(c.provider_id) ?? 0) + 1)
    if (c.is_weekend) {
      providerWeekend.set(c.provider_id, (providerWeekend.get(c.provider_id) ?? 0) + 1)
    }
  }

  return claims.map(c => {
    if (!c.is_weekend) return flag(c.claim_id, 'weekend_anomaly', false, '')
    const hasSurgical = c.procedure_codes.some(isSurgical)
    if (!hasSurgical) return flag(c.claim_id, 'weekend_anomaly', false, '')
    const total = providerTotal.get(c.provider_id) ?? 0
    const weekend = providerWeekend.get(c.provider_id) ?? 0
    const rate = total > 0 ? weekend / total : 0
    const triggered = rate < WEEKEND_RATE_THRESHOLD
    return flag(c.claim_id, 'weekend_anomaly', triggered,
      triggered ? `Provider ${c.provider_id} weekend rate ${(rate * 100).toFixed(1)}% < 5%; surgical on weekend` : '')
  })
}

// Rule 7: Diagnosis-procedure mismatch
// For diagnoses with a known valid procedure set, flag claims that use a procedure outside that set.
export function ruleDxProcMismatch(claims: Claim[]): RuleFlag[] {
  return claims.map(c => {
    const validSet = VALID_DX_PROCS[c.diagnosis_code]
    if (!validSet) return flag(c.claim_id, 'dx_proc_mismatch', false, '')
    const invalid = c.procedure_codes.filter(p => !validSet.includes(p))
    const triggered = invalid.length > 0
    return flag(c.claim_id, 'dx_proc_mismatch', triggered,
      triggered ? `Diagnosis ${c.diagnosis_code} with invalid procedures: ${invalid.join(', ')} (valid: ${validSet.join(', ')})` : '')
  })
}

// Rule 8: Amount clustering — submitted_amount in [47500, 50000)
export function ruleAmountClustering(claims: Claim[]): RuleFlag[] {
  return claims.map(c => {
    const triggered = c.submitted_amount >= CLUSTER_LOW && c.submitted_amount < CLUSTER_HIGH
    return flag(c.claim_id, 'amount_clustering', triggered,
      triggered ? `Amount $${c.submitted_amount.toFixed(2)} in clustering range [$${CLUSTER_LOW}, $${CLUSTER_HIGH})` : '')
  })
}

// Run all 8 rules and return per-claim flag arrays
export function applyAllRules(claims: Claim[]): Map<string, RuleFlag[]> {
  const ruleFns = [
    ruleDuplicate,
    ruleRapidResubmission,
    ruleUpcoding,
    ruleUnbundling,
    rulePhantomBilling,
    ruleWeekendAnomaly,
    ruleDxProcMismatch,
    ruleAmountClustering,
  ]

  // Collect all flags per claim_id
  const claimFlags = new Map<string, RuleFlag[]>()
  for (const c of claims) claimFlags.set(c.claim_id, [])

  for (const fn of ruleFns) {
    const results = fn(claims)
    for (const f of results) {
      if (f.triggered) claimFlags.get(f.claim_id)?.push(f)
    }
  }
  return claimFlags
}

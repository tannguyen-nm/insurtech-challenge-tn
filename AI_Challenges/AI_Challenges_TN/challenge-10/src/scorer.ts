import type { RuleFlag, ScoredClaim } from './types.js'
import { MAX_POSSIBLE } from './constants.js'

export function scoreClaim(claim_id: string, flags: RuleFlag[]): ScoredClaim {
  const triggered = flags.filter(f => f.triggered)
  const weightedSum = triggered.reduce((s, f) => s + f.severity, 0)
  const score = Math.min(100, Math.round((weightedSum / MAX_POSSIBLE) * 100))
  return { claim_id, score, flags: triggered }
}

export function scoreAll(claimFlags: Map<string, RuleFlag[]>): ScoredClaim[] {
  const scored: ScoredClaim[] = []
  for (const [claim_id, flags] of claimFlags) {
    scored.push(scoreClaim(claim_id, flags))
  }
  return scored.sort((a, b) => b.score - a.score)
}

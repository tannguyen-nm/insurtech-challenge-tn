import { describe, it, expect } from 'vitest'
import {
  ruleDuplicate,
  ruleRapidResubmission,
  ruleUpcoding,
  ruleUnbundling,
  rulePhantomBilling,
  ruleWeekendAnomaly,
  ruleDxProcMismatch,
  ruleAmountClustering,
} from '../src/rules.js'
import { scoreClaim } from '../src/scorer.js'
import type { Claim } from '../src/types.js'

function makeClaim(overrides: Partial<Claim> & { claim_id: string }): Claim {
  return {
    member_id: 'MBR-001',
    provider_id: 'PRV-001',
    provider_name: 'Test Clinic',
    claim_date: '2024-01-10',
    claim_type: 'OUTPATIENT',
    diagnosis_code: 'Z00.00',
    procedure_codes: ['P-0500'],
    submitted_amount: 1000,
    is_weekend: false,
    ...overrides,
  }
}

// Rule 1: Duplicate
describe('ruleDuplicate', () => {
  it('triggers when two claims share member, provider, date, diagnosis', () => {
    const claims = [
      makeClaim({ claim_id: 'A', member_id: 'MBR-1', provider_id: 'PRV-1', claim_date: '2024-03-01', diagnosis_code: 'J45.909' }),
      makeClaim({ claim_id: 'B', member_id: 'MBR-1', provider_id: 'PRV-1', claim_date: '2024-03-01', diagnosis_code: 'J45.909' }),
    ]
    const flags = ruleDuplicate(claims)
    expect(flags.find(f => f.claim_id === 'A')?.triggered).toBe(true)
    expect(flags.find(f => f.claim_id === 'B')?.triggered).toBe(true)
  })

  it('does not trigger for a single claim', () => {
    const claims = [makeClaim({ claim_id: 'A' })]
    const flags = ruleDuplicate(claims)
    expect(flags[0].triggered).toBe(false)
  })

  it('does not trigger when only date differs', () => {
    const claims = [
      makeClaim({ claim_id: 'A', claim_date: '2024-01-01' }),
      makeClaim({ claim_id: 'B', claim_date: '2024-01-02' }),
    ]
    const flags = ruleDuplicate(claims)
    expect(flags.every(f => !f.triggered)).toBe(true)
  })
})

// Rule 2: Rapid re-submission
describe('ruleRapidResubmission', () => {
  it('triggers when same member+diagnosis within 7 days', () => {
    const claims = [
      makeClaim({ claim_id: 'A', member_id: 'MBR-1', claim_date: '2024-03-01', diagnosis_code: 'E11.9' }),
      makeClaim({ claim_id: 'B', member_id: 'MBR-1', claim_date: '2024-03-05', diagnosis_code: 'E11.9' }),
    ]
    const flags = ruleRapidResubmission(claims)
    expect(flags.find(f => f.claim_id === 'B')?.triggered).toBe(true)
    expect(flags.find(f => f.claim_id === 'A')?.triggered).toBe(false)
  })

  it('does not trigger when gap is exactly 8 days', () => {
    const claims = [
      makeClaim({ claim_id: 'A', member_id: 'MBR-1', claim_date: '2024-03-01', diagnosis_code: 'E11.9' }),
      makeClaim({ claim_id: 'B', member_id: 'MBR-1', claim_date: '2024-03-09', diagnosis_code: 'E11.9' }),
    ]
    const flags = ruleRapidResubmission(claims)
    expect(flags.find(f => f.claim_id === 'B')?.triggered).toBe(false)
  })

  it('does not trigger for different diagnoses', () => {
    const claims = [
      makeClaim({ claim_id: 'A', member_id: 'MBR-1', claim_date: '2024-03-01', diagnosis_code: 'E11.9' }),
      makeClaim({ claim_id: 'B', member_id: 'MBR-1', claim_date: '2024-03-02', diagnosis_code: 'I10' }),
    ]
    const flags = ruleRapidResubmission(claims)
    expect(flags.every(f => !f.triggered)).toBe(true)
  })
})

// Rule 3: Upcoding
describe('ruleUpcoding', () => {
  it('triggers when amount exceeds mean + 2 std for procedure', () => {
    const base = Array.from({ length: 10 }, (_, i) =>
      makeClaim({ claim_id: `C${i}`, procedure_codes: ['PROC-X'], submitted_amount: 1000 }))
    const upcoded = makeClaim({ claim_id: 'UP', procedure_codes: ['PROC-X'], submitted_amount: 100000 })
    const flags = ruleUpcoding([...base, upcoded])
    expect(flags.find(f => f.claim_id === 'UP')?.triggered).toBe(true)
  })

  it('does not trigger for procedure with fewer than 5 samples', () => {
    const claims = [
      makeClaim({ claim_id: 'A', procedure_codes: ['RARE'], submitted_amount: 999999 }),
      makeClaim({ claim_id: 'B', procedure_codes: ['RARE'], submitted_amount: 1 }),
    ]
    const flags = ruleUpcoding(claims)
    expect(flags.every(f => !f.triggered)).toBe(true)
  })

  it('does not trigger for amount within normal range', () => {
    const base = Array.from({ length: 10 }, (_, i) =>
      makeClaim({ claim_id: `C${i}`, procedure_codes: ['PROC-Y'], submitted_amount: 1000 + i * 100 }))
    const flags = ruleUpcoding(base)
    expect(flags.every(f => !f.triggered)).toBe(true)
  })
})

// Rule 4: Unbundling
describe('ruleUnbundling', () => {
  it('triggers when claim has all components of a known bundle', () => {
    const claims = [makeClaim({ claim_id: 'A', procedure_codes: ['P-0100', 'P-0101', 'P-0102'] })]
    const flags = ruleUnbundling(claims)
    expect(flags[0].triggered).toBe(true)
    expect(flags[0].evidence).toContain('BUNDLE-A')
  })

  it('does not trigger for partial bundle', () => {
    const claims = [makeClaim({ claim_id: 'A', procedure_codes: ['P-0100', 'P-0101'] })]
    const flags = ruleUnbundling(claims)
    expect(flags[0].triggered).toBe(false)
  })

  it('triggers for bundle E', () => {
    const claims = [makeClaim({ claim_id: 'A', procedure_codes: ['P-0112', 'P-0113', 'P-0114'] })]
    const flags = ruleUnbundling(claims)
    expect(flags[0].triggered).toBe(true)
  })
})

// Rule 5: Phantom billing
describe('rulePhantomBilling', () => {
  it('triggers for all claims from provider with > 30 claims on one day', () => {
    const claims = Array.from({ length: 31 }, (_, i) =>
      makeClaim({ claim_id: `P${i}`, provider_id: 'PRV-X', claim_date: '2024-06-15' }))
    const flags = rulePhantomBilling(claims)
    expect(flags.every(f => f.triggered)).toBe(true)
  })

  it('does not trigger for exactly 30 claims (threshold > 30)', () => {
    const claims = Array.from({ length: 30 }, (_, i) =>
      makeClaim({ claim_id: `P${i}`, provider_id: 'PRV-Y', claim_date: '2024-06-15' }))
    const flags = rulePhantomBilling(claims)
    expect(flags.every(f => !f.triggered)).toBe(true)
  })
})

// Rule 6: Weekend anomaly
describe('ruleWeekendAnomaly', () => {
  it('triggers for surgical claim on weekend with low provider weekend rate', () => {
    // 400 weekday claims + 10 weekend normal = 4.97% weekend rate (< 5%)
    const weekday = Array.from({ length: 400 }, (_, i) =>
      makeClaim({ claim_id: `W${i}`, provider_id: 'PRV-LOW', claim_date: '2024-01-01', is_weekend: false, procedure_codes: ['P-0100'] }))
    const weekendNormal = Array.from({ length: 10 }, (_, i) =>
      makeClaim({ claim_id: `WN${i}`, provider_id: 'PRV-LOW', claim_date: '2024-01-06', is_weekend: true, procedure_codes: ['P-0100'] }))
    const suspicious = makeClaim({ claim_id: 'SUSP', provider_id: 'PRV-LOW', is_weekend: true, procedure_codes: ['S-0300'] })
    const flags = ruleWeekendAnomaly([...weekday, ...weekendNormal, suspicious])
    expect(flags.find(f => f.claim_id === 'SUSP')?.triggered).toBe(true)
  })

  it('does not trigger for non-surgical weekend claim', () => {
    const weekday = Array.from({ length: 100 }, (_, i) =>
      makeClaim({ claim_id: `W${i}`, provider_id: 'PRV-LOW2', is_weekend: false }))
    const c = makeClaim({ claim_id: 'X', provider_id: 'PRV-LOW2', is_weekend: true, procedure_codes: ['P-0100'] })
    const flags = ruleWeekendAnomaly([...weekday, c])
    expect(flags.find(f => f.claim_id === 'X')?.triggered).toBe(false)
  })

  it('does not trigger for provider with high weekend rate', () => {
    const claims = Array.from({ length: 10 }, (_, i) =>
      makeClaim({ claim_id: `W${i}`, provider_id: 'PRV-HIGH', is_weekend: i % 2 === 0 }))
    const c = makeClaim({ claim_id: 'X', provider_id: 'PRV-HIGH', is_weekend: true, procedure_codes: ['S-0300'] })
    const flags = ruleWeekendAnomaly([...claims, c])
    expect(flags.find(f => f.claim_id === 'X')?.triggered).toBe(false)
  })
})

// Rule 7: Diagnosis-procedure mismatch
describe('ruleDxProcMismatch', () => {
  it('triggers when procedure is invalid for known diagnosis', () => {
    const claims = [makeClaim({ claim_id: 'A', diagnosis_code: 'J45.909', procedure_codes: ['P-0200'] })]
    const flags = ruleDxProcMismatch(claims)
    expect(flags[0].triggered).toBe(true)
  })

  it('does not trigger when procedure is valid for diagnosis', () => {
    const claims = [makeClaim({ claim_id: 'A', diagnosis_code: 'J45.909', procedure_codes: ['P-0107'] })]
    const flags = ruleDxProcMismatch(claims)
    expect(flags[0].triggered).toBe(false)
  })

  it('does not trigger for unknown diagnosis', () => {
    const claims = [makeClaim({ claim_id: 'A', diagnosis_code: 'UNKNOWN', procedure_codes: ['P-9999'] })]
    const flags = ruleDxProcMismatch(claims)
    expect(flags[0].triggered).toBe(false)
  })
})

// Rule 8: Amount clustering
describe('ruleAmountClustering', () => {
  it('triggers for amount at 47500 (lower bound inclusive)', () => {
    const claims = [makeClaim({ claim_id: 'A', submitted_amount: 47500 })]
    const flags = ruleAmountClustering(claims)
    expect(flags[0].triggered).toBe(true)
  })

  it('triggers for amount in middle of range', () => {
    const claims = [makeClaim({ claim_id: 'A', submitted_amount: 48500 })]
    const flags = ruleAmountClustering(claims)
    expect(flags[0].triggered).toBe(true)
  })

  it('does not trigger for amount at 50000 (upper bound exclusive)', () => {
    const claims = [makeClaim({ claim_id: 'A', submitted_amount: 50000 })]
    const flags = ruleAmountClustering(claims)
    expect(flags[0].triggered).toBe(false)
  })

  it('does not trigger for amount below 47500', () => {
    const claims = [makeClaim({ claim_id: 'A', submitted_amount: 47499.99 })]
    const flags = ruleAmountClustering(claims)
    expect(flags[0].triggered).toBe(false)
  })
})

// Scoring
describe('scoreClaim', () => {
  it('returns 0 for no flags', () => {
    const result = scoreClaim('X', [])
    expect(result.score).toBe(0)
  })

  it('computes composite score for multiple flags', () => {
    const flags = [
      { claim_id: 'X', rule: 'duplicate', triggered: true, severity: 5, evidence: 'dup' },
      { claim_id: 'X', rule: 'phantom_billing', triggered: true, severity: 5, evidence: 'phantom' },
    ]
    const result = scoreClaim('X', flags)
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.flags.length).toBe(2)
  })

  it('caps score at 100', () => {
    const flags = [
      { claim_id: 'X', rule: 'r1', triggered: true, severity: 100, evidence: 'e' },
      { claim_id: 'X', rule: 'r2', triggered: true, severity: 100, evidence: 'e' },
    ]
    const result = scoreClaim('X', flags)
    expect(result.score).toBe(100)
  })

  it('returns only triggered flags', () => {
    const flags = [
      { claim_id: 'X', rule: 'duplicate', triggered: true, severity: 5, evidence: 'dup' },
      { claim_id: 'X', rule: 'upcoding', triggered: false, severity: 4, evidence: '' },
    ]
    const result = scoreClaim('X', flags)
    expect(result.flags.length).toBe(1)
    expect(result.flags[0].rule).toBe('duplicate')
  })
})

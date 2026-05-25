import { validateClaim, diffCountryRules } from '../src/lib/engine';
import type { Claim, CountryConfig } from '../src/types';

// ── Load configs directly (no import.meta.glob in Jest) ───────────────────
const TH = require('../src/configs/TH.json') as CountryConfig;
const VN = require('../src/configs/VN.json') as CountryConfig;
const HK = require('../src/configs/HK.json') as CountryConfig;
const SG = require('../src/configs/SG.json') as CountryConfig;

function makeClaim(overrides: Partial<Claim>): Claim {
  return {
    claim_id: 'TEST-001',
    country: 'TH',
    claim_type: 'OUTPATIENT',
    submission_date: '2024-06-01',
    policy_start_date: '2024-01-01',
    is_pre_existing: false,
    documents: ['medical_receipt', 'prescription'],
    national_id: '*****1234',
    processing_days: 5,
    ...overrides,
  };
}

// 1. Fully compliant TH outpatient
test('TH outpatient fully compliant', () => {
  const claim = makeClaim({});
  const result = validateClaim(claim, TH);
  expect(result.overall_status).toBe('COMPLIANT');
  expect(result.rules.every((r) => r.status !== 'FAIL')).toBe(true);
});

// 2. Missing required document — TH inpatient no discharge_summary
test('TH inpatient fails missing discharge_summary', () => {
  const claim = makeClaim({ claim_type: 'INPATIENT', documents: ['medical_receipt'] });
  const result = validateClaim(claim, TH);
  const docRule = result.rules.find((r) => r.rule_id === 'TH-DOC-002');
  expect(docRule?.status).toBe('FAIL');
  expect(docRule?.message).toContain('discharge summary');
  expect(result.overall_status).not.toBe('COMPLIANT');
});

// 3. SLA exceeded — TH outpatient 20 business days > 15
test('TH outpatient fails SLA when processing_days=20', () => {
  const claim = makeClaim({ processing_days: 20 });
  const result = validateClaim(claim, TH);
  const sla = result.rules.find((r) => r.rule_id === 'TH-SLA-001');
  expect(sla?.status).toBe('FAIL');
  expect(sla?.message).toContain('exceeded');
});

// 4. Waiting period — TH pre-existing, 60 days < 120 required
test('TH pre-existing fails waiting period (60 days < 120)', () => {
  const claim = makeClaim({
    submission_date: '2024-03-01',
    policy_start_date: '2024-01-01',
    is_pre_existing: true,
  });
  const result = validateClaim(claim, TH);
  const wait = result.rules.find((r) => r.rule_id === 'TH-WAIT-001');
  expect(wait?.status).toBe('FAIL');
  expect(wait?.message).toContain('pre-existing');
});

// 5. Data masking — TH national_id unmasked
test('TH fails data masking when national_id is unmasked', () => {
  const claim = makeClaim({ national_id: '1234567890123' });
  const result = validateClaim(claim, TH);
  const mask = result.rules.find((r) => r.rule_id === 'TH-MASK-001');
  expect(mask?.status).toBe('FAIL');
});

// 6. Data masking — TH national_id correctly masked
test('TH passes data masking when national_id ends *****1234', () => {
  const claim = makeClaim({ national_id: '*****1234' });
  const result = validateClaim(claim, TH);
  const mask = result.rules.find((r) => r.rule_id === 'TH-MASK-001');
  expect(mask?.status).toBe('PASS');
});

// 7. Rule versioning — TH-DOC-004 (effective 2024-07-01) not applied to June claim
test('TH-DOC-004 not applied to claim submitted before 2024-07-01', () => {
  const claim = makeClaim({ claim_type: 'SPECIALIST', documents: ['medical_receipt'], submission_date: '2024-06-01' });
  const result = validateClaim(claim, TH);
  const doc4 = result.rules.find((r) => r.rule_id === 'TH-DOC-004');
  expect(doc4).toBeUndefined(); // rule was filtered out — not active yet
});

// 8. Rule versioning — TH-DOC-004 IS applied to July claim
test('TH-DOC-004 applied to claim submitted on/after 2024-07-01', () => {
  const claim = makeClaim({
    claim_type: 'SPECIALIST',
    documents: ['medical_receipt'],
    submission_date: '2024-07-15',
  });
  const result = validateClaim(claim, TH);
  const doc4 = result.rules.find((r) => r.rule_id === 'TH-DOC-004');
  expect(doc4).toBeDefined();
  expect(doc4?.status).toBe('FAIL'); // lab_report missing
});

// 9. VN — missing id_card_copy fails VN-DOC-003
test('VN outpatient fails when id_card_copy missing', () => {
  const claim = makeClaim({
    country: 'VN',
    documents: ['medical_receipt'],
    full_name: 'N. Van N.',
  });
  const result = validateClaim(claim, VN);
  const rule = result.rules.find((r) => r.rule_id === 'VN-DOC-003');
  expect(rule?.status).toBe('FAIL');
  expect(rule?.message).toContain('id card copy');
});

// 10. VN — pre-existing 200 days < 365 required
test('VN pre-existing fails waiting period (200 days < 365)', () => {
  const claim = makeClaim({
    country: 'VN',
    submission_date: '2024-07-19',
    policy_start_date: '2024-01-01',
    is_pre_existing: true,
    documents: ['medical_receipt', 'id_card_copy'],
    full_name: 'P. Van P.',
  });
  const result = validateClaim(claim, VN);
  const wait = result.rules.find((r) => r.rule_id === 'VN-WAIT-001');
  expect(wait?.status).toBe('FAIL');
});

// 11. VN — full_name masking: "N. Van N." passes
test('VN passes masking for properly masked full_name', () => {
  const claim = makeClaim({ country: 'VN', documents: ['medical_receipt', 'id_card_copy'], full_name: 'N. Van N.' });
  const result = validateClaim(claim, VN);
  const mask = result.rules.find((r) => r.rule_id === 'VN-MASK-001');
  expect(mask?.status).toBe('PASS');
});

// 12. HK — specialist missing referral_letter
test('HK specialist fails when referral_letter missing', () => {
  const claim = makeClaim({
    country: 'HK',
    claim_type: 'SPECIALIST',
    documents: ['medical_receipt'],
    hkid: 'A****3',
  });
  const result = validateClaim(claim, HK);
  const rule = result.rules.find((r) => r.rule_id === 'HK-DOC-002');
  expect(rule?.status).toBe('FAIL');
  expect(rule?.message).toContain('referral letter');
});

// 13. HK — general waiting period 30 days < 60 required
test('HK fails waiting period (30 days < 60 general)', () => {
  const claim = makeClaim({
    country: 'HK',
    submission_date: '2024-01-31',
    policy_start_date: '2024-01-01',
    hkid: 'C****2',
  });
  const result = validateClaim(claim, HK);
  const wait = result.rules.find((r) => r.rule_id === 'HK-WAIT-001');
  expect(wait?.status).toBe('FAIL');
  expect(wait?.message).toContain('60');
});

// 14. HK — HKID unmasked fails
test('HK fails masking when hkid is unmasked', () => {
  const claim = makeClaim({ country: 'HK', hkid: 'AB123456' });
  const result = validateClaim(claim, HK);
  const mask = result.rules.find((r) => r.rule_id === 'HK-MASK-001');
  expect(mask?.status).toBe('FAIL');
});

// 15. Rule diff — TH vs VN waiting periods differ
test('Rule diff identifies waiting period difference between TH and VN', () => {
  const diffs = diffCountryRules(TH, VN);
  const waitDiff = diffs.find((d) => d.rule_type === 'waiting_period' && d.status === 'differs');
  expect(waitDiff).toBeDefined();
  expect(waitDiff?.diff?.pre_existing_days).toBeDefined();
  const { a, b } = waitDiff!.diff!.pre_existing_days;
  expect(a).toBe(120); // TH
  expect(b).toBe(365); // VN
});

// 16. SG skeleton config loads and engine validates without code changes
test('SG skeleton config validates claims correctly', () => {
  const claim = makeClaim({ country: 'SG', national_id: '*****5678' });
  const result = validateClaim(claim, SG);
  expect(result.country).toBe('SG');
  expect(result.overall_status).toBeDefined();
});

// 17. Coverage mandate always_pass for TH emergency
test('TH coverage mandate always passes', () => {
  const claim = makeClaim({ is_emergency: true });
  const result = validateClaim(claim, TH);
  const cov = result.rules.find((r) => r.rule_id === 'TH-COV-001');
  expect(cov?.status).toBe('PASS');
});

// 18. Multiple failures → PARTIALLY_COMPLIANT when some rules pass
test('PARTIALLY_COMPLIANT when some rules pass and some fail', () => {
  // Missing discharge_summary but everything else ok → some pass (DOC-001, SLA, WAIT, MASK, COV), one fail (DOC-002)
  const claim = makeClaim({ claim_type: 'INPATIENT', documents: ['medical_receipt'] });
  const result = validateClaim(claim, TH);
  expect(result.overall_status).toBe('PARTIALLY_COMPLIANT');
});

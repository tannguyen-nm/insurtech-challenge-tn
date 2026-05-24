import { calculateCoverage } from '../src/lib/calculator';
import type { Policy, Expense } from '../src/types';

const basePolicy: Policy = {
  policy_number: 'TEST-001',
  effective_date: '2024-01-01',
  expiry_date: '2024-12-31',
  currency: 'THB',
  deductible: 0,
  benefits: [
    {
      type: 'OUTPATIENT',
      annual_limit: 20000,
      copay_percentage: 20,
      copay_max_per_visit: 500,
      sub_benefits: [
        { name: 'Doctor Visit', limit_per_visit: 1500, visits_per_year: 5 },
        { name: 'Prescribed Medicine', limit_per_visit: 1000 },
        { name: 'Diagnostic Tests', limit_per_year: 3000 },
      ],
    },
    {
      type: 'INPATIENT',
      annual_limit: 50000,
      copay_percentage: 0,
      sub_benefits: [
        { name: 'Room & Board', limit_per_day: 3000 },
        { name: 'Surgery', limit_per_event: 40000 },
      ],
    },
    {
      type: 'DENTAL',
      annual_limit: 8000,
      copay_percentage: 30,
      waiting_period_days: 90,
      sub_benefits: [{ name: 'Basic Dental', limit_per_visit: 2000 }],
    },
    {
      type: 'MATERNITY',
      annual_limit: 30000,
      copay_percentage: 0,
      waiting_period_days: 270,
      sub_benefits: [{ name: 'Normal Delivery', limit_per_event: 25000 }],
    },
  ],
  exclusions: ['Cosmetic surgery', 'Self-inflicted injuries'],
};

function makeExpense(overrides: Partial<Expense>): Expense {
  return {
    expense_id: 'EXP-T001',
    date: '2024-06-01',
    benefit_type: 'OUTPATIENT',
    sub_benefit: 'Doctor Visit',
    amount: 1000,
    diagnosis: 'General checkup',
    provider: 'Test Hospital',
    ...overrides,
  };
}

// 1. Normal — fully covered INPATIENT (no copay, under all limits)
test('INPATIENT fully covered when under all limits', () => {
  const exp = makeExpense({ benefit_type: 'INPATIENT', sub_benefit: 'Surgery', amount: 30000, diagnosis: 'Appendectomy' });
  const { results } = calculateCoverage(basePolicy, [exp]);
  expect(results[0].decision).toBe('COVERED');
  expect(results[0].covered_amount).toBe(30000);
  expect(results[0].member_pays).toBe(0);
});

// 2. OUTPATIENT copay applied correctly (percentage)
test('OUTPATIENT copay 20% applied', () => {
  const exp = makeExpense({ amount: 1000, sub_benefit: 'Doctor Visit', diagnosis: 'Flu' });
  const { results } = calculateCoverage(basePolicy, [exp]);
  expect(results[0].copay_amount).toBe(200);
  expect(results[0].covered_amount).toBe(800);
  expect(results[0].decision).toBe('PARTIALLY_COVERED');
});

// 3. Copay capped at max_per_visit
test('Copay capped at copay_max_per_visit', () => {
  // 20% of 1500 = 300, but max is 500 — so copay should be 300
  // Now try amount where 20% exceeds 500: amount = 3000 → 20% = 600 > 500 → copay = 500
  // But sub-limit is 1500/visit, so sub_amount = 1500 → 20% = 300 (under max)
  // Use Prescribed Medicine (limit 1000) with amount 5000
  // sub_amount = min(5000, 1000) = 1000 → copay = min(200, 500) = 200
  // Actually need copay > 500 raw: use Doctor Visit limit 1500, amount=3000 → sub=1500, copay=300 < 500
  // Better: use DENTAL which has no max_per_visit cap concern
  // Let's use a policy with copay_max_per_visit=200:
  const policy: Policy = {
    ...basePolicy,
    benefits: basePolicy.benefits.map((b) =>
      b.type === 'OUTPATIENT'
        ? { ...b, copay_percentage: 30, copay_max_per_visit: 200 }
        : b
    ),
  };
  const exp = makeExpense({ amount: 1500, sub_benefit: 'Doctor Visit', diagnosis: 'Test' });
  // sub_limit = min(1500, 1500)=1500, copay=30%*1500=450, but max=200 → copay=200
  const { results } = calculateCoverage(policy, [exp]);
  expect(results[0].copay_amount).toBe(200);
  expect(results[0].covered_amount).toBe(1300);
});

// 4. Annual limit exhaustion — expense denied
test('Denied when annual limit exhausted', () => {
  const policy: Policy = {
    ...basePolicy,
    benefits: basePolicy.benefits.map((b) =>
      b.type === 'OUTPATIENT' ? { ...b, annual_limit: 500 } : b
    ),
  };
  // First expense uses up 500 limit, second is denied
  const exp1 = makeExpense({ expense_id: 'EXP-1', date: '2024-01-01', amount: 1000, sub_benefit: 'Prescribed Medicine', diagnosis: 'Meds' });
  const exp2 = makeExpense({ expense_id: 'EXP-2', date: '2024-01-02', amount: 500, sub_benefit: 'Prescribed Medicine', diagnosis: 'Meds 2' });
  const { results } = calculateCoverage(policy, [exp1, exp2]);
  // exp1: sub_limit=min(1000,1000)=1000, copay=200, covered_net=800, annual_cap=min(800,500)=500
  expect(results[0].covered_amount).toBe(500);
  expect(results[1].decision).toBe('DENIED_LIMIT_EXHAUSTED');
  expect(results[1].covered_amount).toBe(0);
});

// 5. Partial coverage when remaining limit < expense
test('Partial coverage when remaining annual limit < expense', () => {
  const policy: Policy = {
    ...basePolicy,
    benefits: basePolicy.benefits.map((b) =>
      b.type === 'INPATIENT' ? { ...b, annual_limit: 5000 } : b
    ),
  };
  const exp = makeExpense({
    benefit_type: 'INPATIENT',
    sub_benefit: 'Surgery',
    amount: 20000,
    diagnosis: 'Major surgery',
  });
  const { results } = calculateCoverage(policy, [exp]);
  expect(results[0].covered_amount).toBe(5000);
  expect(results[0].member_pays).toBe(15000);
  expect(results[0].decision).toBe('PARTIALLY_COVERED');
});

// 6. Waiting period denial — claim within waiting period
test('DENTAL denied within 90-day waiting period', () => {
  const exp = makeExpense({
    date: '2024-02-01', // within 90 days of 2024-01-01
    benefit_type: 'DENTAL',
    sub_benefit: 'Basic Dental',
    amount: 2000,
    diagnosis: 'Cavity filling',
  });
  const { results } = calculateCoverage(basePolicy, [exp]);
  expect(results[0].decision).toBe('DENIED_WAITING_PERIOD');
  expect(results[0].covered_amount).toBe(0);
});

// 7. Waiting period boundary — claim on exact day after waiting period ends
test('DENTAL covered on day after waiting period ends', () => {
  // 90 days from 2024-01-01 → ends at 2024-03-31, so 2024-04-01 is first valid day
  const exp = makeExpense({
    date: '2024-04-01',
    benefit_type: 'DENTAL',
    sub_benefit: 'Basic Dental',
    amount: 1000,
    diagnosis: 'Routine cleaning',
  });
  const { results } = calculateCoverage(basePolicy, [exp]);
  expect(results[0].decision).not.toBe('DENIED_WAITING_PERIOD');
  expect(results[0].covered_amount).toBeGreaterThan(0);
});

// 8. Exclusion denial
test('Expense denied when diagnosis matches exclusion', () => {
  const exp = makeExpense({ diagnosis: 'Rhinoplasty cosmetic surgery procedure' });
  const { results } = calculateCoverage(basePolicy, [exp]);
  expect(results[0].decision).toBe('DENIED_EXCLUSION');
  expect(results[0].covered_amount).toBe(0);
});

// 9. Deductible applied before copay — deductible absorbs entire expense
test('Deductible absorbs full expense when deductible > amount', () => {
  const policy: Policy = { ...basePolicy, deductible: 5000 };
  const exp = makeExpense({ amount: 1000, sub_benefit: 'Doctor Visit', diagnosis: 'Checkup' });
  const { results } = calculateCoverage(policy, [exp]);
  expect(results[0].decision).toBe('DEDUCTIBLE_APPLIED');
  expect(results[0].covered_amount).toBe(0);
  expect(results[0].deductible_applied).toBe(1000);
});

// 10. Deductible partially applied, then copay on remainder
test('Deductible partially applied then copay on remainder', () => {
  const policy: Policy = { ...basePolicy, deductible: 500 };
  const exp = makeExpense({ amount: 1500, sub_benefit: 'Doctor Visit', diagnosis: 'Visit' });
  // deductible absorbs 500, eligible = 1000
  // sub_limit: min(1000, 1500)=1000, copay: 20%*1000=200, covered=800
  const { results } = calculateCoverage(policy, [exp]);
  expect(results[0].deductible_applied).toBe(500);
  expect(results[0].copay_amount).toBe(200);
  expect(results[0].covered_amount).toBe(800);
  expect(results[0].decision).toBe('PARTIALLY_COVERED');
});

// 11. Deductible carries across multiple expenses
test('Deductible state carries across multiple expenses', () => {
  const policy: Policy = { ...basePolicy, deductible: 1500 };
  const exp1 = makeExpense({ expense_id: 'E1', date: '2024-01-01', amount: 1000, sub_benefit: 'Prescribed Medicine', diagnosis: 'Meds' });
  const exp2 = makeExpense({ expense_id: 'E2', date: '2024-01-02', amount: 1000, sub_benefit: 'Prescribed Medicine', diagnosis: 'More meds' });
  // E1: deductible absorbs 1000 → remaining=500, covered=0
  // E2: deductible absorbs 500, eligible=500, sub_limit=500, copay=100, covered=400
  const { results } = calculateCoverage(policy, [exp1, exp2]);
  expect(results[0].decision).toBe('DEDUCTIBLE_APPLIED');
  expect(results[0].covered_amount).toBe(0);
  expect(results[1].deductible_applied).toBe(500);
  expect(results[1].covered_amount).toBe(400);
});

// 12. visits_per_year limit exhaustion
test('Doctor Visit denied after visits_per_year exhausted', () => {
  const policy: Policy = {
    ...basePolicy,
    benefits: basePolicy.benefits.map((b) =>
      b.type === 'OUTPATIENT'
        ? {
            ...b,
            sub_benefits: b.sub_benefits.map((s) =>
              s.name === 'Doctor Visit' ? { ...s, visits_per_year: 2 } : s
            ),
          }
        : b
    ),
  };
  const visits = [
    makeExpense({ expense_id: 'V1', date: '2024-01-01', amount: 500, diagnosis: 'Visit 1' }),
    makeExpense({ expense_id: 'V2', date: '2024-01-05', amount: 500, diagnosis: 'Visit 2' }),
    makeExpense({ expense_id: 'V3', date: '2024-01-10', amount: 500, diagnosis: 'Visit 3' }),
  ];
  const { results } = calculateCoverage(policy, visits);
  expect(results[0].decision).not.toBe('DENIED_LIMIT_EXHAUSTED');
  expect(results[1].decision).not.toBe('DENIED_LIMIT_EXHAUSTED');
  expect(results[2].decision).toBe('DENIED_LIMIT_EXHAUSTED');
});

// 13. Sub-benefit limit_per_year exhaustion
test('Diagnostic Tests denied after per-year limit exhausted', () => {
  const exp1 = makeExpense({
    expense_id: 'D1',
    date: '2024-01-01',
    sub_benefit: 'Diagnostic Tests',
    amount: 4000,
    diagnosis: 'Blood panel',
  });
  const exp2 = makeExpense({
    expense_id: 'D2',
    date: '2024-01-05',
    sub_benefit: 'Diagnostic Tests',
    amount: 1000,
    diagnosis: 'Thyroid test',
  });
  // exp1: sub-year limit=3000; 20%copay on 3000=600; covered=2400 (sub-year limit exhausts 3000 of insurer payout)
  // wait: sub_gross = 4000 (no per_visit limit). copay=min(800,500)=500. covered_after_copay=3500. sub-year cap=3000 → covered=3000.
  // remaining sub-year limit = 0
  // exp2: sub-year limit = 0 → DENIED
  const { results } = calculateCoverage(basePolicy, [exp1, exp2]);
  expect(results[0].covered_amount).toBe(3000);
  expect(results[1].decision).toBe('DENIED_LIMIT_EXHAUSTED');
});

// 14. Multiple expenses consuming same annual limit (state carries)
test('Annual limit depletes across multiple expenses', () => {
  const policy: Policy = {
    ...basePolicy,
    benefits: basePolicy.benefits.map((b) =>
      b.type === 'INPATIENT' ? { ...b, annual_limit: 6000 } : b
    ),
  };
  const exps = [
    makeExpense({ expense_id: 'I1', date: '2024-01-01', benefit_type: 'INPATIENT', sub_benefit: 'Room & Board', amount: 3000, diagnosis: 'Day 1' }),
    makeExpense({ expense_id: 'I2', date: '2024-01-02', benefit_type: 'INPATIENT', sub_benefit: 'Room & Board', amount: 3000, diagnosis: 'Day 2' }),
    makeExpense({ expense_id: 'I3', date: '2024-01-03', benefit_type: 'INPATIENT', sub_benefit: 'Room & Board', amount: 3000, diagnosis: 'Day 3' }),
  ];
  const { results, summary } = calculateCoverage(policy, exps);
  expect(results[0].covered_amount).toBe(3000);
  expect(results[1].covered_amount).toBe(3000);
  expect(results[2].decision).toBe('DENIED_LIMIT_EXHAUSTED');
  const inp = summary.find((s) => s.benefit_type === 'INPATIENT');
  expect(inp?.remaining).toBe(0);
});

// 15. Maternity waiting period (270 days)
test('MATERNITY denied within 270-day waiting period', () => {
  const exp = makeExpense({
    date: '2024-06-01', // within 270 days of 2024-01-01
    benefit_type: 'MATERNITY',
    sub_benefit: 'Normal Delivery',
    amount: 20000,
    diagnosis: 'Normal birth',
  });
  const { results } = calculateCoverage(basePolicy, [exp]);
  expect(results[0].decision).toBe('DENIED_WAITING_PERIOD');
});

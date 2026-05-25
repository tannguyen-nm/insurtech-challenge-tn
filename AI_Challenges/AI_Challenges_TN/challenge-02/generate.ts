import { faker } from '@faker-js/faker';
import { stringify } from 'csv-stringify/sync';
import { writeFileSync, mkdirSync } from 'fs';

interface RawRow {
  claim_id: string;
  policy_id: string;
  member_name: string;
  claim_type: string;
  diagnosis: string;
  submitted_amount: string | number;
  currency: string;
  submitted_date: string;
  status: string;
}

const CLAIM_TYPES = ['OUTPATIENT', 'INPATIENT', 'DENTAL'] as const;
const STATUSES = ['APPROVED', 'REJECTED', 'PENDING', 'IN_REVIEW'] as const;
const DIAGNOSES = [
  'Flu', 'Hypertension', 'Diabetes', 'Back Pain', 'Migraine',
  'Allergies', 'Fracture', 'Appendicitis', 'Asthma', 'Pneumonia',
  'Gastritis', 'UTI', 'Anxiety', 'Depression', 'COVID-19',
];
const CURRENCIES = ['THB', 'VND'] as const;

const CLAIM_TYPE_TYPOS: Record<string, string[]> = {
  OUTPATIENT: ['Outpateint', 'outpatient', 'OP', 'Out Patient'],
  INPATIENT:  ['inpatient', 'IP', 'In Patient'],
  DENTAL:     ['dental', 'Dental care', 'DNTL'],
};

const CURRENCY_VARIANTS: Record<string, string[]> = {
  THB: ['thb', 'Baht', 'baht'],
  VND: ['vnd', 'Dong', 'dong'],
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function fmtISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function fmtDMY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function fmtLong(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function introduceIssues(rows: RawRow[]): void {
  // ~18% of rows get at least one issue, distributed across 7 issue types
  const targetCount = Math.floor(rows.length * 0.18);
  const indices = shuffle([...Array(rows.length).keys()]).slice(0, targetCount);
  const perBucket = Math.floor(indices.length / 7);

  let i = 0;

  // 1. Missing claim_id
  indices.slice(i, i + perBucket).forEach(idx => { rows[idx].claim_id = ''; });
  i += perBucket;

  // 2. Duplicate claim_id (point at an existing valid id)
  const validIds = rows.filter(r => r.claim_id).map(r => r.claim_id);
  indices.slice(i, i + perBucket).forEach(idx => { rows[idx].claim_id = pick(validIds); });
  i += perBucket;

  // 3. Mixed member_name casing
  indices.slice(i, i + perBucket).forEach(idx => {
    const r = rows[idx];
    r.member_name = Math.random() > 0.5
      ? r.member_name.toUpperCase()
      : r.member_name.toLowerCase();
  });
  i += perBucket;

  // 4. Claim type typos
  indices.slice(i, i + perBucket).forEach(idx => {
    const r = rows[idx];
    const typos = CLAIM_TYPE_TYPOS[r.claim_type as string] ?? CLAIM_TYPE_TYPOS['OUTPATIENT'];
    r.claim_type = pick(typos);
  });
  i += perBucket;

  // 5. Bad diagnosis
  indices.slice(i, i + perBucket).forEach(idx => {
    rows[idx].diagnosis = pick(['', 'N/A', 'n/a', 'NA']);
  });
  i += perBucket;

  // 6. Invalid submitted_amount
  indices.slice(i, i + perBucket).forEach(idx => {
    const r = rows[idx];
    const variant = randInt(0, 2);
    if (variant === 0) r.submitted_amount = -Math.abs(Number(r.submitted_amount));
    else if (variant === 1) r.submitted_amount = 0;
    else r.submitted_amount = Number(r.submitted_amount).toLocaleString('en-US'); // "15,000"
  });
  i += perBucket;

  // 7. Mixed currency variants
  indices.slice(i).forEach(idx => {
    const r = rows[idx];
    const variants = CURRENCY_VARIANTS[r.currency as string] ?? CURRENCY_VARIANTS['THB'];
    r.currency = pick(variants);
  });
}

function generate(): void {
  const start = new Date('2023-01-01');
  const end = new Date('2024-12-31');

  const rows: RawRow[] = Array.from({ length: 500 }, (_, n) => {
    const claimType = pick(CLAIM_TYPES);
    const currency = pick(CURRENCIES);
    const d = randomDate(start, end);
    return {
      claim_id:         `CLM-${String(n + 1).padStart(5, '0')}`,
      policy_id:        `POL-${randInt(100, 999)}`,
      member_name:      faker.person.fullName(),
      claim_type:       claimType,
      diagnosis:        pick(DIAGNOSES),
      submitted_amount: randInt(1000, 200000),
      currency,
      submitted_date:   fmtISO(d),
      status:           pick(STATUSES),
    };
  });

  // Add 10 exact duplicate rows before introducing issues
  for (let k = 0; k < 10; k++) {
    const src = rows[randInt(0, rows.length - 1)];
    rows.push({ ...src });
  }

  // Mixed date formats on 30 random rows
  for (let k = 0; k < 30; k++) {
    const r = rows[randInt(0, rows.length - 1)];
    const d = new Date(r.submitted_date as string);
    r.submitted_date = Math.random() > 0.5 ? fmtDMY(d) : fmtLong(d);
  }

  introduceIssues(rows);

  mkdirSync('./data', { recursive: true });
  writeFileSync('./data/dirty_claims.csv', stringify(rows, { header: true }));
  console.log(`Generated ${rows.length} rows → data/dirty_claims.csv`);
}

generate();

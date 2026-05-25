import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { readFileSync, writeFileSync } from 'fs';

interface RawRow {
  claim_id:         string;
  policy_id:        string;
  member_name:      string;
  claim_type:       string;
  diagnosis:        string;
  submitted_amount: string;
  currency:         string;
  submitted_date:   string;
  status:           string;
}

interface CleanRow extends RawRow {
  has_issues: string;
  issue_list: string;
}

// --- Mapping tables ---

const CLAIM_TYPE_MAP: Record<string, string> = {
  OUTPATIENT: 'OUTPATIENT', outpatient: 'OUTPATIENT',
  Outpateint: 'OUTPATIENT', OP: 'OUTPATIENT',
  'Out Patient': 'OUTPATIENT', 'out patient': 'OUTPATIENT',
  INPATIENT: 'INPATIENT',  inpatient: 'INPATIENT',
  IP: 'INPATIENT', 'In Patient': 'INPATIENT', 'in patient': 'INPATIENT',
  DENTAL: 'DENTAL', dental: 'DENTAL',
  'Dental care': 'DENTAL', 'dental care': 'DENTAL', DNTL: 'DENTAL',
};

const CURRENCY_MAP: Record<string, string> = {
  THB: 'THB', thb: 'THB', Baht: 'THB', baht: 'THB',
  VND: 'VND', vnd: 'VND', Dong: 'VND', dong: 'VND',
};

// --- Helpers ---

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function isNullish(s: string): boolean {
  return !s || ['n/a', 'na', 'null', 'none', '-', ''].includes(s.toLowerCase().trim());
}

function parseAmount(s: string): number | null {
  const cleaned = s.replace(/,/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseDate(s: string): string | null {
  if (!s) return null;

  // ISO: 2024-03-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + 'T00:00:00Z');
    return isNaN(d.getTime()) ? null : s;
  }

  // DMY: 15/03/2024
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, dd, mm, yyyy] = dmy;
    const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    const d = new Date(iso + 'T00:00:00Z');
    return isNaN(d.getTime()) ? null : iso;
  }

  // Long natural: "March 15, 2024"
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];

  return null;
}

// --- Stats helpers ---

function countBy<T>(rows: T[], key: keyof T): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const r of rows) {
    const v = String(r[key]);
    acc[v] = (acc[v] ?? 0) + 1;
  }
  return acc;
}

function avgAmountByType(rows: CleanRow[]): Record<string, { count: number; avg: number }> {
  const acc: Record<string, { count: number; sum: number }> = {};
  for (const r of rows) {
    const a = parseAmount(r.submitted_amount);
    if (a !== null && a > 0) {
      const t = r.claim_type;
      if (!acc[t]) acc[t] = { count: 0, sum: 0 };
      acc[t].count++;
      acc[t].sum += a;
    }
  }
  return Object.fromEntries(
    Object.entries(acc).map(([t, v]) => [t, { count: v.count, avg: Math.round(v.sum / v.count) }])
  );
}

// --- Main ---

function clean(): void {
  const raw = readFileSync('./data/dirty_claims.csv', 'utf-8');
  const rows: RawRow[] = parse(raw, { columns: true, skip_empty_lines: true });
  const totalBefore = rows.length;

  const issueCounts = {
    exact_duplicates:    0,
    duplicate_claim_ids: 0,
    missing_claim_id:    0,
    name_casing:         0,
    claim_type_typo:     0,
    bad_diagnosis:       0,
    invalid_amount:      0,
    currency_normalized: 0,
    date_normalized:     0,
    unparseable_date:    0,
  };

  // Step 1 — remove exact duplicate rows
  const seen = new Set<string>();
  const deduped: RawRow[] = [];
  for (const row of rows) {
    const key = JSON.stringify(row);
    if (seen.has(key)) { issueCounts.exact_duplicates++; }
    else { seen.add(key); deduped.push(row); }
  }

  // Step 2 — detect duplicate claim_ids (informational)
  const idFreq = new Map<string, number>();
  for (const row of deduped) {
    if (row.claim_id) idFreq.set(row.claim_id, (idFreq.get(row.claim_id) ?? 0) + 1);
    else issueCounts.missing_claim_id++;
  }
  for (const count of idFreq.values()) {
    if (count > 1) issueCounts.duplicate_claim_ids += count - 1;
  }

  // Step 3 — clean each row
  const cleaned: CleanRow[] = deduped.map(row => {
    const issues: string[] = [];
    const out: CleanRow = { ...row, has_issues: 'false', issue_list: '' };

    // member_name casing
    const titled = toTitleCase(row.member_name);
    if (titled !== row.member_name) {
      out.member_name = titled;
      issues.push('name_casing');
      issueCounts.name_casing++;
    }

    // claim_type canonical mapping
    const canonical = CLAIM_TYPE_MAP[row.claim_type];
    if (canonical === undefined) {
      // unknown — keep as-is
    } else if (canonical !== row.claim_type) {
      out.claim_type = canonical;
      issues.push('claim_type_typo');
      issueCounts.claim_type_typo++;
    }

    // diagnosis — nullify bad values
    if (isNullish(row.diagnosis)) {
      out.diagnosis = '';
      issues.push('bad_diagnosis');
      issueCounts.bad_diagnosis++;
    }

    // submitted_amount — strip commas, flag non-positive
    const amount = parseAmount(row.submitted_amount);
    if (amount === null || amount <= 0) {
      issues.push('invalid_amount');
      issueCounts.invalid_amount++;
    } else {
      out.submitted_amount = String(amount);
    }

    // currency normalize
    const normCurrency = CURRENCY_MAP[row.currency];
    if (normCurrency && normCurrency !== row.currency) {
      out.currency = normCurrency;
      issues.push('currency_normalized');
      issueCounts.currency_normalized++;
    }

    // date parse
    const parsedDate = parseDate(row.submitted_date);
    if (!parsedDate) {
      issues.push('unparseable_date');
      issueCounts.unparseable_date++;
    } else if (parsedDate !== row.submitted_date) {
      out.submitted_date = parsedDate;
      issues.push('date_normalized');
      issueCounts.date_normalized++;
    }

    out.has_issues = issues.length > 0 ? 'true' : 'false';
    out.issue_list = issues.join(';');
    return out;
  });

  writeFileSync('./data/clean_claims.csv', stringify(cleaned, { header: true }));

  // --- Report ---
  const totalAfter = cleaned.length;
  const withIssues = cleaned.filter(r => r.has_issues === 'true').length;

  const byType = countBy(cleaned, 'claim_type');
  const byStatus = countBy(cleaned, 'status');
  const avgByType = avgAmountByType(cleaned);

  const diagCounts: Record<string, number> = {};
  for (const r of cleaned) {
    if (r.diagnosis) diagCounts[r.diagnosis] = (diagCounts[r.diagnosis] ?? 0) + 1;
  }
  const top5 = Object.entries(diagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const lines = [
    '=== CLAIMS DATA QUALITY REPORT ===',
    '',
    `Rows before cleaning     : ${totalBefore}`,
    `Rows after cleaning      : ${totalAfter}`,
    `Rows with any issue      : ${withIssues}`,
    `Exact duplicates removed : ${issueCounts.exact_duplicates}`,
    '',
    '--- Issue Counts (by type) ---',
    `  missing_claim_id     : ${issueCounts.missing_claim_id}`,
    `  duplicate_claim_ids  : ${issueCounts.duplicate_claim_ids}`,
    `  name_casing          : ${issueCounts.name_casing}`,
    `  claim_type_typo      : ${issueCounts.claim_type_typo}`,
    `  bad_diagnosis        : ${issueCounts.bad_diagnosis}`,
    `  invalid_amount       : ${issueCounts.invalid_amount}`,
    `  currency_normalized  : ${issueCounts.currency_normalized}`,
    `  date_normalized      : ${issueCounts.date_normalized}`,
    `  unparseable_date     : ${issueCounts.unparseable_date}`,
    '',
    '--- Claims by Type ---',
    ...Object.entries(byType).map(([t, c]) => {
      const avg = avgByType[t]?.avg ?? 0;
      return `  ${t.padEnd(14)} count=${c}  avg_amount=$${avg.toLocaleString()}`;
    }),
    '',
    '--- Claims by Status ---',
    ...Object.entries(byStatus).map(([s, c]) => `  ${s.padEnd(14)} ${c}`),
    '',
    '--- Top 5 Diagnoses ---',
    ...top5.map(([d, c], i) => `  ${i + 1}. ${d.padEnd(16)} (${c})`),
  ];

  const report = lines.join('\n');
  writeFileSync('./report.txt', report);
  console.log(report);
  console.log('\nOutput: data/clean_claims.csv, report.txt');
}

clean();

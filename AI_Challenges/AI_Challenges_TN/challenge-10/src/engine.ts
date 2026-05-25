import { createReadStream, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'csv-parse'
import type { Claim, Metrics } from './types.js'
import { applyAllRules } from './rules.js'
import { scoreAll } from './scorer.js'
import { SCORE_THRESHOLD } from './constants.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

async function readCsv<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const rows: T[] = []
    createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', (row: Record<string, string>) => rows.push(row as unknown as T))
      .on('end', () => resolve(rows))
      .on('error', reject)
  })
}

async function loadClaims(): Promise<Claim[]> {
  const raw = await readCsv<Record<string, string>>(join(ROOT, 'claims_raw.csv'))
  return raw.map(r => ({
    claim_id: r.claim_id,
    member_id: r.member_id,
    provider_id: r.provider_id,
    provider_name: r.provider_name,
    claim_date: r.claim_date,
    claim_type: r.claim_type,
    diagnosis_code: r.diagnosis_code,
    procedure_codes: JSON.parse(r.procedure_codes) as string[],
    submitted_amount: parseFloat(r.submitted_amount),
    is_weekend: r.is_weekend === 'True',
  }))
}

async function loadLabels(): Promise<Map<string, boolean>> {
  const raw = await readCsv<{ claim_id: string; is_fraud: string }>(join(ROOT, 'claims_labels.csv'))
  return new Map(raw.map(r => [r.claim_id, r.is_fraud === 'True']))
}

function calcMetrics(scored: { claim_id: string; score: number }[], labels: Map<string, boolean>, threshold: number): Metrics {
  let tp = 0, fp = 0, fn = 0, tn = 0
  for (const s of scored) {
    const predicted = s.score >= threshold
    const actual = labels.get(s.claim_id) ?? false
    if (predicted && actual) tp++
    else if (predicted && !actual) fp++
    else if (!predicted && actual) fn++
    else tn++
  }
  return {
    threshold,
    tp, fp, fn, tn,
    precision: tp + fp > 0 ? tp / (tp + fp) : 0,
    recall: tp + fn > 0 ? tp / (tp + fn) : 0,
    fpr: fp + tn > 0 ? fp / (fp + tn) : 0,
  }
}

async function main() {
  console.time('engine')
  const [claims, labels] = await Promise.all([loadClaims(), loadLabels()])
  console.log(`Loaded ${claims.length} claims, ${[...labels.values()].filter(Boolean).length} fraud labels`)

  const claimFlags = applyAllRules(claims)
  const scored = scoreAll(claimFlags)

  // Write scored output
  writeFileSync(join(ROOT, 'scored_claims.json'), JSON.stringify(scored, null, 2))
  console.log('Written scored_claims.json')

  // Compute metrics at chosen threshold
  const m = calcMetrics(scored, labels, SCORE_THRESHOLD)

  // Also compute metrics at multiple thresholds for report
  const thresholds = [5, 10, 15, 20, 25, 30]
  const allMetrics = thresholds.map(t => calcMetrics(scored, labels, t))

  const report = [
    '=== Fraud Detection Engine — Metrics Report ===',
    `Claims processed: ${claims.length}`,
    `Known fraud: ${[...labels.values()].filter(Boolean).length}`,
    '',
    `--- Chosen threshold: ${SCORE_THRESHOLD} ---`,
    `Precision : ${(m.precision * 100).toFixed(1)}%`,
    `Recall    : ${(m.recall * 100).toFixed(1)}%`,
    `FPR       : ${(m.fpr * 100).toFixed(1)}%`,
    `TP=${m.tp}  FP=${m.fp}  FN=${m.fn}  TN=${m.tn}`,
    '',
    'Threshold sweep:',
    'Threshold | Precision | Recall | FPR    | TP  FP  FN  TN',
    '-'.repeat(62),
    ...allMetrics.map(x =>
      `${String(x.threshold).padStart(9)} | ${(x.precision*100).toFixed(1).padStart(9)}% | ${(x.recall*100).toFixed(1).padStart(6)}% | ${(x.fpr*100).toFixed(1).padStart(6)}% | ${x.tp} ${x.fp} ${x.fn} ${x.tn}`
    ),
    '',
    'Score distribution:',
    ...scoreDistribution(scored),
  ].join('\n')

  writeFileSync(join(ROOT, 'metrics_report.txt'), report)
  console.log('Written metrics_report.txt')
  console.log(`\nAt threshold ${SCORE_THRESHOLD}: Recall=${(m.recall*100).toFixed(1)}% FPR=${(m.fpr*100).toFixed(1)}%`)

  const target = m.recall >= 0.70 && m.fpr <= 0.20
  console.log(`Target met (recall≥70%, FPR≤20%): ${target ? 'YES ✓' : 'NO ✗'}`)
  console.timeEnd('engine')
}

function scoreDistribution(scored: { score: number }[]): string[] {
  const buckets = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
  const lines: string[] = []
  for (let i = 0; i < buckets.length - 1; i++) {
    const lo = buckets[i], hi = buckets[i + 1]
    const count = scored.filter(s => s.score >= lo && s.score < hi).length
    lines.push(`  [${String(lo).padStart(3)}-${String(hi).padStart(3)}): ${count}`)
  }
  lines.push(`  [100]:    ${scored.filter(s => s.score === 100).length}`)
  return lines
}

main().catch(err => { console.error(err); process.exit(1) })

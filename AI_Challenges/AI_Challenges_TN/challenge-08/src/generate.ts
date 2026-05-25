import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RECEIPTS, renderReceipt } from './docs/receipt.js';
import { DISCHARGES, renderDischarge } from './docs/discharge.js';
import { LABS, renderLabReport } from './docs/labReport.js';
import { PRESCRIPTIONS, renderPrescription } from './docs/prescription.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, '..', 'docs');

interface DocSpec {
  filename: string;
  html: string;
  type: string;
}

function buildDocs(): DocSpec[] {
  const docs: DocSpec[] = [];
  for (const r of RECEIPTS) {
    docs.push({ filename: `receipt_${r.id}.png`, html: renderReceipt(r), type: 'receipt' });
  }
  for (const d of DISCHARGES) {
    docs.push({ filename: `discharge_${d.id}.png`, html: renderDischarge(d), type: 'discharge_summary' });
  }
  for (const l of LABS) {
    docs.push({ filename: `lab_${l.id}.png`, html: renderLabReport(l), type: 'lab_report' });
  }
  for (const p of PRESCRIPTIONS) {
    docs.push({ filename: `prescription_${p.id}.png`, html: renderPrescription(p), type: 'prescription' });
  }
  return docs;
}

async function main() {
  const docs = buildDocs();
  console.log(`Generating ${docs.length} documents...`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 1100, deviceScaleFactor: 2 });

  const manifest: Record<string, string> = {};

  for (const doc of docs) {
    await page.setContent(doc.html, { waitUntil: 'networkidle0' });
    const outPath = path.join(DOCS_DIR, doc.filename);
    await page.screenshot({ path: outPath as `${string}.png`, fullPage: true });
    manifest[doc.filename] = doc.type;
    console.log(`  ✓ ${doc.filename}`);
  }

  await browser.close();

  writeFileSync(path.join(DOCS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${docs.length} PNGs written to docs/`);
}

main().catch(err => { console.error(err); process.exit(1); });

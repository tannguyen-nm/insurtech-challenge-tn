import 'dotenv/config';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processDocument } from './pipeline.js';
import { validate } from './validate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const RESULTS_DIR = path.join(__dirname, '..', 'results');

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not set');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(path.join(DOCS_DIR, 'manifest.json'), 'utf-8')) as Record<string, string>;
  const files = Object.keys(manifest).filter(f => f.endsWith('.png'));

  console.log(`Processing ${files.length} documents...\n`);

  const allResults: Record<string, unknown>[] = [];

  for (const filename of files) {
    const imagePath = path.join(DOCS_DIR, filename);
    const expectedType = manifest[filename];
    console.log(`Processing ${filename} (expected: ${expectedType})...`);

    try {
      const raw = await processDocument(imagePath);
      const result = validate(raw);
      const classified_correctly = result.document_type === expectedType;

      const output = {
        file: filename,
        expected_type: expectedType,
        classified_correctly,
        ...result,
      };

      writeFileSync(
        path.join(RESULTS_DIR, filename.replace('.png', '.json')),
        JSON.stringify(output, null, 2)
      );

      console.log(`  type: ${result.document_type} (${classified_correctly ? '✓ correct' : `✗ expected ${expectedType}`})`);
      console.log(`  confidence: ${result.confidence}`);
      if (result.validation_errors.length > 0) {
        console.log(`  validation errors: ${result.validation_errors.join('; ')}`);
      }
      allResults.push(output);
    } catch (err) {
      console.error(`  ERROR: ${err instanceof Error ? err.message : String(err)}`);
      allResults.push({ file: filename, error: String(err) });
    }

    // Delay between docs — 2 API calls per doc, free tier is 15 RPM
    await new Promise(r => setTimeout(r, 5000));
  }

  writeFileSync(path.join(RESULTS_DIR, 'all_results.json'), JSON.stringify(allResults, null, 2));

  // Summary stats
  const successful = allResults.filter(r => !('error' in r));
  const correct = successful.filter(r => (r as { classified_correctly: boolean }).classified_correctly);
  const withErrors = successful.filter(r => ((r as { validation_errors: string[] }).validation_errors ?? []).length > 0);

  console.log(`\n=== Summary ===`);
  console.log(`Documents processed: ${allResults.length}`);
  console.log(`Classification accuracy: ${correct.length}/${successful.length}`);
  console.log(`Documents with validation errors: ${withErrors.length}`);
  console.log(`Results saved to results/`);
}

main().catch(err => { console.error(err); process.exit(1); });

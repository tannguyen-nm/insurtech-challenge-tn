import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { ClassificationResultSchema, type DocType, type ExtractionOutput } from './types.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const EXTRACTION_SYSTEM = `You are a precise insurance claims document processor. Extract structured data from medical documents exactly as printed — never infer or fabricate data not visible in the image.

Confidence scoring rules:
- 1.0: field is clearly printed, unambiguous
- 0.7–0.9: readable but slightly degraded or partially obscured
- 0.3–0.6: inferred or reconstructed from context
- <0.3: not visible — value MUST be null

If a field is not present in the document, return {"value": null, "confidence": 0.1}.
Always return valid JSON matching the requested schema exactly.`;

const EXTRACTION_PROMPTS: Record<DocType, string> = {
  receipt: `Extract all fields from this hospital receipt/invoice. Return JSON only:
{
  "hospital_name": {"value": string|null, "confidence": number},
  "patient_name": {"value": string|null, "confidence": number},
  "date": {"value": string|null, "confidence": number},
  "items": {"value": [{"description": string, "quantity": number|null, "unit_price": number|null, "total": number|null}]|null, "confidence": number},
  "grand_total": {"value": number|null, "confidence": number},
  "payment_method": {"value": string|null, "confidence": number}
}`,

  discharge_summary: `Extract all fields from this hospital discharge summary. Return JSON only:
{
  "hospital_name": {"value": string|null, "confidence": number},
  "patient_name": {"value": string|null, "confidence": number},
  "admission_date": {"value": string|null, "confidence": number},
  "discharge_date": {"value": string|null, "confidence": number},
  "diagnosis_primary": {"value": string|null, "confidence": number},
  "diagnosis_secondary": {"value": string[]|null, "confidence": number},
  "procedures_performed": {"value": string[]|null, "confidence": number},
  "attending_physician": {"value": string|null, "confidence": number},
  "discharge_instructions": {"value": string|null, "confidence": number}
}`,

  lab_report: `Extract all fields from this laboratory report. For each test, compare result to reference range to determine flag. Return JSON only:
{
  "lab_name": {"value": string|null, "confidence": number},
  "patient_name": {"value": string|null, "confidence": number},
  "date": {"value": string|null, "confidence": number},
  "tests": {"value": [{"test_name": string, "result": string|number|null, "unit": string|null, "reference_range": string|null, "flag": "normal"|"high"|"low"|null}]|null, "confidence": number}
}`,

  prescription: `Extract all fields from this medical prescription. Return JSON only:
{
  "doctor_name": {"value": string|null, "confidence": number},
  "patient_name": {"value": string|null, "confidence": number},
  "date": {"value": string|null, "confidence": number},
  "medications": {"value": [{"name": string, "dosage": string|null, "frequency": string|null, "duration": string|null, "quantity": string|number|null}]|null, "confidence": number}
}`
};

function imageToBase64(filePath: string): string {
  return readFileSync(filePath).toString('base64');
}

async function generateWithRetry(parts: Parameters<typeof model.generateContent>[0], retries = 3): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(parts);
      return result.response.text();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Parse retryDelay from error (e.g. "retryDelay":"31.1s") and cap at 65s
      const retryMatch = msg.match(/"retryDelay":"([\d.]+)s"/);
      const waitSec = retryMatch ? Math.min(Math.ceil(parseFloat(retryMatch[1])) + 2, 65) : 15;
      if (attempt < retries && (msg.includes('429') || msg.includes('503'))) {
        console.log(`  Rate limited — retrying in ${waitSec}s...`);
        await new Promise(r => setTimeout(r, waitSec * 1000));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

export async function classifyDocument(imagePath: string): Promise<{ type: DocType; confidence: number; reasoning: string }> {
  const b64 = imageToBase64(imagePath);
  const text = await generateWithRetry([
    { inlineData: { data: b64, mimeType: 'image/png' } },
    'What type of medical document is this? Choose exactly one of: receipt, discharge_summary, lab_report, prescription. Return only valid JSON: {"document_type": "...", "confidence": 0.0-1.0, "reasoning": "one sentence"}'
  ]);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Classification parse failed: ${text}`);
  const parsed = ClassificationResultSchema.parse(JSON.parse(jsonMatch[0]));
  return { type: parsed.document_type, confidence: parsed.confidence, reasoning: parsed.reasoning };
}

export async function extractFields(imagePath: string, docType: DocType): Promise<Record<string, unknown>> {
  const b64 = imageToBase64(imagePath);
  const text = await generateWithRetry([
    { inlineData: { data: b64, mimeType: 'image/png' } },
    EXTRACTION_SYSTEM + '\n\n' + EXTRACTION_PROMPTS[docType]
  ]);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Extraction parse failed: ${text}`);
  return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
}

export async function processDocument(imagePath: string): Promise<ExtractionOutput & { _reasoning?: string }> {
  const { type, confidence, reasoning } = await classifyDocument(imagePath);
  const fields = await extractFields(imagePath, type);
  return { document_type: type, confidence, fields, validation_errors: [], _reasoning: reasoning };
}

# Challenge 08 — Medical Document Extractor

**Deployment:** None — CLI pipeline only. Requires `GEMINI_API_KEY`.

## What it does

Generates mock medical document PNGs (receipts, discharge summaries, lab reports, prescriptions) then extracts structured data from each using Gemini's vision API. Returns per-field values with confidence scores and validation errors.

## Stack

Node.js + TypeScript + tsx · `@google/generative-ai` (gemini-2.5-flash) · Puppeteer · Zod

## Setup

```bash
npm install
cp .env.example .env
# Add GEMINI_API_KEY to .env
```

## Run

```bash
# Step 1: Generate 10 mock medical document PNGs
npm run generate

# Step 2: Extract structured data from all documents
npm run run
# → results/all_results.json
```

## Output format

```json
{
  "document_type": "receipt",
  "confidence": 0.97,
  "fields": {
    "hospital_name": { "value": "Bangkok Hospital", "confidence": 0.99 },
    "grand_total": { "value": 6700, "confidence": 0.98 }
  },
  "validation_errors": []
}
```

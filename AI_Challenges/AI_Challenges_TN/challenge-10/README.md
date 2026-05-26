# Challenge 10 — Fraud Detection Scoring Engine

**Deployment:** None — CLI / library only.

## What it does

Rule-based fraud detection engine that scores insurance claims. Applies configurable rules (duplicate detection, amount anomalies, high-risk providers, short hospitalization, etc.) and produces a risk score with rule hit details.

## Stack

Node.js + TypeScript · Vitest

## Usage

```bash
npm install

# Run against sample dataset
npm run engine
# → scored_claims.json
# → metrics_report.txt

# Run tests
npm test
```

## Output format

Each scored claim includes `score` (0–100) and `flags` array with triggered rules, severity, and evidence.

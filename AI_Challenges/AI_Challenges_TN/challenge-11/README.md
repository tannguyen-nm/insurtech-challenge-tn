# Challenge 11 — Claim Assessment AI Agent

**Deployment:** None — CLI agent only. Requires `GEMINI_API_KEY`.

## What it does

Agentic claims assessment loop powered by Google Gemini. The agent receives a claim, uses tools to look up policy details, check medical necessity, verify documents, and calculate benefits, then produces an APPROVE / REJECT / REQUEST_MORE_INFO decision with reasoning.

## Stack

Node.js + TypeScript · `@google/generative-ai` (gemini-2.5-flash) · Tool-use agent loop

## Setup

```bash
npm install
cp .env.example .env
# Add GEMINI_API_KEY to .env
```

## Run

```bash
npm run dev
# Runs assessment on all 3 test cases in src/data/
# Output logs written to logs/case_*.json
```

> **Rate limit:** Free tier is 5 RPM. Agent waits 35s between cases — expect ~3 minutes total runtime.

## Tool call sequence

Enforced by system prompt (strict order):

1. `verifyDocument` — called once per submitted document (e.g. 3 docs = 3 calls)
2. `lookupPolicy` — fetch coverage terms, limits, exclusions
3. `checkMedicalNecessity` — validate diagnosis + procedure pair
4. `calculateBenefit` — compute covered amount after copay/limits

## Test cases

| Case | Claim | Type | Amount | Scenario | Expected |
|------|-------|------|--------|----------|----------|
| case_1 | CLM-001 | Outpatient | $1,200 | All docs valid, within limits | **APPROVE** |
| case_2 | CLM-002 | Inpatient | $15,000 | All docs valid, annual limit exhausted ($1,800 remaining) | **REJECT** |
| case_3 | CLM-003 | Dental | $2,800 | Treatment plan missing | **REQUEST_MORE_INFO** |

## Output format

Each case writes a JSON log to `logs/case_*.json`:

```json
{
  "caseId": "case_1",
  "toolCalls": [
    { "tool": "verifyDocument", "input": { "claimId": "CLM-001", "documentType": "referral" }, "output": { ... }, "timestamp": "..." }
  ],
  "assessmentReport": {
    "outcome": "APPROVE",
    "coveredAmount": 960,
    "documentReview": "referral: present and valid; medicalReport: present and valid; itemizedReceipt: present and valid",
    "policyVerification": "Policy POL-001 is ACTIVE. Outpatient benefit covered up to $3,000/visit ...",
    "medicalNecessity": "Necessity determination: True. Upper respiratory infection with detailed office visit is appropriate.",
    "benefitCalculation": "Claimed: $1,200. Covered: $960. Member copay (20%): $240.",
    "recommendation": "Approve — all documents valid, policy active, medical necessity confirmed, within limits.",
    "policyCitations": [
      "Section 2.1: Annual Benefit Limit",
      "Section 3.1: Outpatient Benefit",
      "Section 4.1: Copayment",
      "Section 5.1: Claim Documentation"
    ]
  }
}
```

# Challenge 07 — Claims Intake Wizard

**Live URL:** https://insurtech-challenge-07.vercel.app

## What it does

5-step guided form for submitting an insurance claim. Each step validates before advancing; all data accumulates in a single form instance and is reviewed on the final step before submission.

## Steps

| Step | Description |
|---|---|
| 1 — Claim Type | OUTPATIENT / INPATIENT / DENTAL / LIFE; major dental toggle |
| 2 — Member Info | Policyholder or select a dependent from mock roster |
| 3 — Diagnosis | ICD-10 autocomplete with debounced search (150ms) |
| 4 — Documents | Upload PDFs/images; required vs optional docs per claim type |
| 5 — Review & Submit | Summary of all steps with inline edit links |

## Stack

Next.js 16 App Router + TypeScript · React Hook Form + Zod · Tailwind CSS v4

## Local dev

```bash
npm install
npm run dev
# http://localhost:3000
```

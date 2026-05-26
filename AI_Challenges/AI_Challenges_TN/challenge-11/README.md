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

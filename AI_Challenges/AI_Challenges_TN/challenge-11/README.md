# Challenge 11 — Claim Assessment AI Agent

**Deployment:** None — CLI agent only. Requires `ANTHROPIC_API_KEY`.

## What it does

Agentic claims assessment loop powered by Claude. The agent receives a claim, uses tools to look up policy details, check fraud signals, and validate documents, then produces an approval/rejection decision with reasoning.

## Stack

Node.js + TypeScript · `@anthropic-ai/sdk` (Claude claude-sonnet-4-6) · Tool-use agent loop

## Setup

```bash
npm install
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env
```

## Run

```bash
npm start
# Runs assessment on all test cases in src/data/
```

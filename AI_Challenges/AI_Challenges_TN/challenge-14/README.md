# Challenge 14 — Claims Workflow Orchestrator

**Live URL:** https://insurtech-challenge-14.vercel.app

## What it does

Visual workflow engine for claims processing. Two tabs:

| Tab | Description |
|---|---|
| Scenarios | Run predefined claim scenarios through the workflow; see each state transition and decision |
| Explorer | Browse the full workflow graph — states, transitions, preconditions, and side effects |

## Stack

React + TypeScript + Vite · Tailwind CSS · Jest (unit tests for engine)

## Local dev

```bash
npm install
npm run dev
# http://localhost:5173
```

## Tests

```bash
npm test
```

### Results (23 tests, all pass)

```
Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        ~0.4s
```

| # | Test | Coverage |
|---|------|----------|
| 1 | document_clerk can verify documents when all complete | valid transition |
| 2 | full happy path completes to CLOSED via PAYMENT_INITIATED | valid transition |
| 3 | assessor can reject claim with report and rejection reason | valid transition |
| 4 | REJECTED → CLOSED passes when member acknowledged | any_of precondition |
| 5 | REJECTED → CLOSED passes when appeal period expired | any_of precondition |
| 6 | REJECTED → CLOSED fails when neither appeal condition met | precondition failure |
| 7 | SUBMITTED → APPROVED throws InvalidTransitionError | invalid transition |
| 8 | InvalidTransitionError lists valid targets | invalid transition |
| 9 | finance cannot verify documents — throws UnauthorizedError | role authorization |
| 10 | document_clerk cannot start assessment — throws UnauthorizedError | role authorization |
| 11 | DOCUMENTS_VERIFIED → UNDER_ASSESSMENT fails without assessor | precondition failure |
| 12 | UNDER_ASSESSMENT → APPROVED fails without assessment report | precondition failure |
| 13 | SUBMITTED → DOCUMENTS_VERIFIED fails with missing documents | precondition failure |
| 14 | 4th PENDING_INFO request throws MaxCyclesExceededError | cycle detection |
| 15 | pending_info_cycle_count increments after each PENDING_INFO | cycle detection |
| 16 | UNDER_ASSESSMENT → APPROVED fails when approved_amount exceeds policy limit | precondition failure |
| 17 | UNDER_ASSESSMENT → APPROVED passes when approved_amount within limit despite high requested_amount | precondition / amount logic |
| 18 | APPROVED side effect creates payment_request_id | side effect |
| 19 | UNDER_ASSESSMENT side effect sets assessment_start_time | side effect |
| 20 | audit trail records all transitions for claim | audit trail |
| 21 | getAuditTrail returns only entries for specified claim | audit trail |
| 22 | getValidTransitions returns transitions from current state | engine API |
| 23 | getValidTransitions filters by actor role | engine API |

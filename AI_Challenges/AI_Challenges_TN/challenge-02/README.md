# Challenge 02 — Claims Data Cleanup & Report

## Stack

Node.js + TypeScript · csv-parse · csv-stringify · @faker-js/faker

## Setup

```bash
npm install
```

## Usage

```bash
# Step 1: generate dirty dataset
npm run generate
# → data/dirty_claims.csv (510 rows with intentional issues)

# Step 2: clean and report
npm run clean
# → data/clean_claims.csv (cleaned, with has_issues + issue_list columns)
# → report.txt (data quality report)
```

## Issue Types Handled

| Issue | Handling |
|-------|----------|
| Exact duplicate rows | Removed |
| Duplicate `claim_id` | Detected, reported |
| Missing `claim_id` | Detected, reported |
| Mixed `member_name` casing | Normalized to Title Case |
| `claim_type` typos (`OP`, `Outpateint`, etc.) | Mapped to canonical (`OUTPATIENT / INPATIENT / DENTAL`) |
| Bad `diagnosis` (`N/A`, `n/a`, empty) | Nullified (empty string) |
| Invalid `submitted_amount` (negative, zero, `"15,000"`) | Comma-stripped; negatives/zero flagged |
| Mixed `currency` (`thb`, `Baht`, `vnd`) | Normalized to uppercase ISO (`THB`, `VND`) |
| Mixed date formats (`15/03/2024`, `March 15, 2024`) | Parsed to ISO 8601 (`YYYY-MM-DD`) |

## Output Columns (clean CSV)

All original columns plus:

- `has_issues` — `true` / `false`
- `issue_list` — semicolon-separated list of issues found on that row

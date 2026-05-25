# Challenge 02 — Claims Data Cleanup & Report

**Deployment:** None — CLI script only.

## What it does

Generates a dirty synthetic claims CSV (510 rows with intentional issues), then cleans it and produces a data quality report.

## Stack

Node.js + TypeScript · csv-parse · csv-stringify · @faker-js/faker

## Usage

```bash
npm install

# Step 1: generate dirty dataset
npm run generate
# → data/dirty_claims.csv

# Step 2: clean and produce report
npm run clean
# → data/clean_claims.csv
# → report.txt
```

## Issues handled

| Issue | Handling |
|---|---|
| Exact duplicate rows | Removed |
| Duplicate `claim_id` | Detected and reported |
| Mixed `member_name` casing | Normalized to Title Case |
| `claim_type` typos (`OP`, `Outpateint`, etc.) | Mapped to canonical values |
| Invalid `submitted_amount` (negative, zero, comma-formatted) | Flagged and cleaned |
| Mixed `currency` (`thb`, `Baht`, `vnd`) | Normalized to ISO uppercase |
| Mixed date formats | Parsed to ISO 8601 |

Output adds `has_issues` and `issue_list` columns to each row.

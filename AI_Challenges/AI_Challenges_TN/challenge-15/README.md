# Challenge 15 — Multi-Tenant Configuration Platform

**Live URL:** https://insurtech-challenge-15.vercel.app

## What it does

Zero-code tenant onboarding for insurers. Each tenant gets a versioned config that controls claim intake, approval routing, notifications, SLA deadlines, and custom fields — no deploys needed.

## Key features

| Feature | Detail |
|---|---|
| Tenant management | Create, edit, delete tenants with full version history |
| Multi-tab config form | Branding · Claim Types · Approval · Notifications · SLA · Custom Fields · Preview · History |
| Version history & rollback | Every save appends a new version; rollback creates a new version (audit trail preserved) |
| Tenant diff | Side-by-side JSON diff between any two tenants |
| Process claim simulator | `POST /api/process-claim` returns approval routing, missing docs, SLA deadline |
| Seeded data | 3 demo tenants: SafeGuard Insurance, HealthFirst HMO, GovHealth Program |

## Pages

| Route | Description |
|---|---|
| `/` | Tenant list |
| `/tenants/new` | Create tenant |
| `/tenants/[id]` | Edit tenant (8-tab form) |
| `/diff` | Compare two tenants |

## API routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/tenants` | List all tenants (summary) |
| POST | `/api/tenants` | Create tenant |
| GET | `/api/tenants/:id` | Get latest config |
| PUT | `/api/tenants/:id` | Save new version |
| DELETE | `/api/tenants/:id` | Delete tenant |
| GET | `/api/tenants/:id/history` | Full version history |
| PUT | `/api/tenants/:id/rollback/:version` | Roll back to version |
| POST | `/api/diff` | `{ tenantIdA, tenantIdB }` → diff entries |
| POST | `/api/process-claim` | Simulate claim processing |

## Stack

- Next.js 16 App Router + TypeScript
- React Hook Form + FormProvider for multi-tab form state
- Tailwind CSS v4
- In-memory store (globalThis singleton, seeded on first request)

## Local dev

```bash
npm install
npm run dev
# http://localhost:3000
```

# Challenge 13 — Partner Integration SDK

**Live URL:** https://insurtech-challenge-13.vercel.app

## What it does

TypeScript SDK for integrating with the Papaya Insurance API. Ships with an Express mock server that the SDK tests run against.

## SDK features

- JWT authentication with auto-refresh (60s before expiry)
- Claims namespace: create, get, list, update status, `onStatusChange` polling
- Documents namespace: upload (multipart), list, download
- Members namespace: get profile
- Retry with exponential backoff (3 retries, configurable base delay)
- Typed errors: `ValidationError`, `AuthError`, `NetworkError`, `ApiError`

## Stack

TypeScript · Node.js · Express (mock server) · Jest + ts-jest (35 tests)

## Install

```bash
npm install
```

## Test

```bash
npm test
# Starts mock server, runs 35 integration + unit tests, shuts down
```

## SDK usage example

```typescript
import { InsuranceSDK } from './src'

const sdk = new InsuranceSDK({ baseUrl: 'https://insurtech-challenge-13.vercel.app' })
await sdk.auth.login('demo@papaya.com', 'password')

const claim = await sdk.claims.create({
  type: 'OUTPATIENT',
  amount: 4500,
  description: 'GP visit + medication',
  documents: [],
})
```

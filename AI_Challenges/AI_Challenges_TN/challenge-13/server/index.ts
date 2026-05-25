import express from 'express'
import { authMiddleware } from './middleware/auth'
import { maybe503, randomDelay } from './middleware/simulate'
import authRouter from './routes/auth'
import claimsRouter from './routes/claims'
import documentsRouter from './routes/documents'
import { setForce503, clearAll } from './store'

export const app = express()

app.use(express.json())

const SIMULATE = process.env.SIMULATE !== 'false'

if (SIMULATE) {
  app.use(maybe503)
  app.use(randomDelay)
} else {
  // In test mode: deterministic 503 control
  app.use(maybe503) // still checks force503Remaining
}

// Test control endpoints (only in test mode)
if (process.env.NODE_ENV === 'test') {
  app.post('/__test/force503', (req, res) => {
    const { count } = req.body as { count?: number }
    setForce503(count ?? 1)
    res.json({ ok: true })
  })
  app.post('/__test/reset', (_req, res) => {
    clearAll()
    res.json({ ok: true })
  })
}

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/claims', authMiddleware, claimsRouter)
app.use('/api/v1/claims/:claimId/documents', authMiddleware, documentsRouter)

app.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.send(LANDING_HTML)
})

if (require.main === module) {
  const PORT = process.env.PORT ?? 3000
  app.listen(PORT, () => {
    console.log(`\nPapaya Insurance Mock API  →  http://localhost:${PORT}`)
    console.log(`Health check              →  http://localhost:${PORT}/health`)
    console.log(`\nTest API key: test-api-key\n`)
  })
}

export default app

const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Papaya Insurance — Partner Integration SDK</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b;line-height:1.6}
  .hero{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:60px 24px;text-align:center}
  .hero h1{font-size:2.4rem;font-weight:800;margin-bottom:12px}
  .hero p{font-size:1.1rem;opacity:.9;max-width:560px;margin:0 auto 24px}
  .badge{display:inline-block;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);border-radius:20px;padding:4px 14px;font-size:.85rem;margin-bottom:16px}
  .container{max-width:900px;margin:0 auto;padding:48px 24px}
  h2{font-size:1.4rem;font-weight:700;color:#1e293b;margin:40px 0 16px;padding-bottom:8px;border-bottom:2px solid #e2e8f0}
  h3{font-size:1rem;font-weight:600;color:#475569;margin:20px 0 8px}
  pre{background:#0f172a;color:#e2e8f0;padding:20px;border-radius:10px;overflow-x:auto;font-size:.88rem;line-height:1.7;margin:12px 0}
  code{background:#e2e8f0;color:#1e293b;padding:2px 6px;border-radius:4px;font-size:.85em}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin:20px 0}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:20px}
  .card h4{font-weight:700;margin-bottom:6px;color:#1e40af}
  .card p{font-size:.9rem;color:#64748b}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)}
  th{background:#f1f5f9;padding:10px 16px;text-align:left;font-size:.85rem;color:#64748b;font-weight:600}
  td{padding:10px 16px;border-top:1px solid #f1f5f9;font-size:.88rem}
  td:first-child{font-family:monospace;color:#1e40af}
  .tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:600}
  .get{background:#dbeafe;color:#1e40af}
  .post{background:#dcfce7;color:#15803d}
  footer{text-align:center;padding:32px;color:#94a3b8;font-size:.875rem;border-top:1px solid #e2e8f0}
</style>
</head>
<body>
<div class="hero">
  <div class="badge">Partner SDK v1.0</div>
  <h1>Papaya Insurance API</h1>
  <p>TypeScript SDK for submitting claims, tracking status, and uploading documents. Auto token refresh, exponential backoff, and full type safety.</p>
</div>
<div class="container">

<h2>Quick Start</h2>
<pre><code class="language-typescript">import { InsuranceSDK } from 'papaya-insurance-sdk'

const sdk = new InsuranceSDK({
  apiKey: 'test-api-key',        // your partner API key
  environment: 'sandbox',         // 'sandbox' | 'production'
  baseUrl: '${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}',
})

// Submit a claim
const claim = await sdk.claims.create({
  policyId: 'POL-2024-001234',
  claimType: 'OUTPATIENT',
  amount: 450.00,
  description: 'GP consultation and lab tests',
  treatmentDate: '2024-01-15',
  providerName: 'City Medical Centre',
})
console.log(claim.id, claim.status) // → CLM-xxx  PENDING
</code></pre>

<h2>Features</h2>
<div class="grid">
  <div class="card"><h4>Auto Token Refresh</h4><p>JWT tokens refresh automatically 60s before expiry. No manual re-authentication needed.</p></div>
  <div class="card"><h4>Retry with Backoff</h4><p>503 errors and network failures retry with exponential backoff (1s → 2s → 4s), up to 3 attempts.</p></div>
  <div class="card"><h4>Typed Errors</h4><p>ValidationError, AuthError, NetworkError, ApiError — each with structured fields for easy handling.</p></div>
  <div class="card"><h4>Status Polling</h4><p>onStatusChange() polls every 5s and fires your callback when claim status changes. Returns unsubscribe fn.</p></div>
</div>

<h2>API Endpoints</h2>
<table>
  <tr><th>Method</th><th>Path</th><th>Description</th></tr>
  <tr><td><span class="tag post">POST</span></td><td>/api/v1/auth/token</td><td>Get JWT — body: <code>{ apiKey }</code></td></tr>
  <tr><td><span class="tag post">POST</span></td><td>/api/v1/claims</td><td>Submit a new claim</td></tr>
  <tr><td><span class="tag get">GET</span></td><td>/api/v1/claims</td><td>List claims — <code>?status=PENDING&page=1&pageSize=20</code></td></tr>
  <tr><td><span class="tag get">GET</span></td><td>/api/v1/claims/:id</td><td>Get a single claim by ID</td></tr>
  <tr><td><span class="tag post">POST</span></td><td>/api/v1/claims/:id/documents</td><td>Upload document (multipart/form-data)</td></tr>
  <tr><td><span class="tag get">GET</span></td><td>/api/v1/claims/:id/documents</td><td>List documents for a claim</td></tr>
  <tr><td><span class="tag get">GET</span></td><td>/health</td><td>Health check</td></tr>
</table>

<h2>Error Handling</h2>
<pre><code class="language-typescript">import { ValidationError, AuthError, ApiError, NetworkError } from 'papaya-insurance-sdk'

try {
  const claim = await sdk.claims.create({ /* ... */ })
} catch (err) {
  if (err instanceof ValidationError) {
    console.error('Invalid input:', err.fields)   // { policyId: 'required' }
  } else if (err instanceof AuthError) {
    console.error('Auth failed:', err.message)
  } else if (err instanceof ApiError) {
    console.error('API error:', err.statusCode, err.message)
  } else if (err instanceof NetworkError) {
    console.error('Network error:', err.message)
  }
}
</code></pre>

<h2>Status Polling</h2>
<pre><code class="language-typescript">const unsubscribe = sdk.claims.onStatusChange(claimId, (newStatus, claim) => {
  console.log('Status changed to:', newStatus)
  if (newStatus === 'APPROVED') {
    console.log('Claim approved!')
    unsubscribe() // Stop polling
  }
})

// Later: manually stop polling
// unsubscribe()
</code></pre>

<h2>Claim Statuses</h2>
<div class="grid">
  <div class="card"><h4>PENDING</h4><p>Claim submitted, awaiting review.</p></div>
  <div class="card"><h4>UNDER_REVIEW</h4><p>Claims team is reviewing the submission.</p></div>
  <div class="card"><h4>APPROVED</h4><p>Claim approved for payment.</p></div>
  <div class="card"><h4>REJECTED</h4><p>Claim rejected. Check rejection reason.</p></div>
  <div class="card"><h4>PAID</h4><p>Payment disbursed to claimant.</p></div>
</div>

</div>
<footer>Papaya Insurance Partner SDK &mdash; Challenge 13 &mdash; Mock API Server</footer>
</body>
</html>`

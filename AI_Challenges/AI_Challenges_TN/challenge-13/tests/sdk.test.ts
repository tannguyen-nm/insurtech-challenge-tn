import request from 'supertest'
import { Server } from 'http'
import { app } from '../server'
import { InsuranceSDK } from '../src/InsuranceSDK'
import { ValidationError, AuthError, ApiError } from '../src/errors'
import type { CreateClaimInput } from '../src/types'

let server: Server
let port: number
let sdk: InsuranceSDK
let testToken: string

const VALID_CLAIM: CreateClaimInput = {
  policyId: 'POL-2024-001234',
  claimType: 'OUTPATIENT',
  amount: 500,
  description: 'GP consultation and blood tests',
  treatmentDate: '2024-01-15',
  providerName: 'City Medical Centre',
}

beforeAll(async () => {
  await new Promise<void>((done) => {
    server = app.listen(0, () => done())
  })
  port = (server.address() as { port: number }).port
  sdk = new InsuranceSDK({
    apiKey: 'test-api-key',
    environment: 'sandbox',
    baseUrl: `http://localhost:${port}`,
  })
  const tokenRes = await request(app).post('/api/v1/auth/token').send({ apiKey: 'test-api-key' })
  testToken = tokenRes.body.token as string
})

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))

beforeEach(async () => {
  await request(app).post('/__test/reset')
})

// ── Auth ───────────────────────────────────────────────────────────────────

describe('Authentication', () => {
  test('valid API key returns JWT token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/token')
      .send({ apiKey: 'test-api-key' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
    expect(res.body.expiresIn).toBe(3600)
  })

  test('invalid API key returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/token')
      .send({ apiKey: 'bad-key' })
    expect(res.status).toBe(401)
  })

  test('SDK with invalid API key throws AuthError', async () => {
    const badSdk = new InsuranceSDK({
      apiKey: 'invalid-key',
      environment: 'sandbox',
      baseUrl: `http://localhost:${port}`,
    })
    await expect(badSdk.claims.list()).rejects.toThrow(AuthError)
  })

  test('token auto-refreshes when expired', async () => {
    // Fetch first token
    await sdk.claims.list()
    // Expire the token
    sdk._tokenStore._expireToken()
    // Next call should refresh transparently
    const result = await sdk.claims.list()
    expect(result).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
  })
})

// ── Claims: create ─────────────────────────────────────────────────────────

describe('claims.create()', () => {
  test('valid input returns claim with ID and PENDING status', async () => {
    const claim = await sdk.claims.create(VALID_CLAIM)
    expect(claim.id).toBeTruthy()
    expect(claim.status).toBe('PENDING')
    expect(claim.policyId).toBe(VALID_CLAIM.policyId)
    expect(claim.amount).toBe(VALID_CLAIM.amount)
    expect(claim.currency).toBe('USD')
  })

  test('missing policyId throws ValidationError with correct field', async () => {
    const bad = { ...VALID_CLAIM, policyId: '' }
    await expect(sdk.claims.create(bad)).rejects.toThrow(ValidationError)
    try {
      await sdk.claims.create(bad)
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError)
      expect((err as ValidationError).fields.policyId).toBeTruthy()
    }
  })

  test('missing description throws ValidationError', async () => {
    const bad = { ...VALID_CLAIM, description: '' }
    try {
      await sdk.claims.create(bad)
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError)
      expect((err as ValidationError).fields.description).toBeTruthy()
    }
  })

  test('negative amount throws ValidationError', async () => {
    const bad = { ...VALID_CLAIM, amount: -100 }
    try {
      await sdk.claims.create(bad)
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError)
      expect((err as ValidationError).fields.amount).toBeTruthy()
    }
  })

  test('invalid claimType throws ValidationError', async () => {
    const bad = { ...VALID_CLAIM, claimType: 'UNKNOWN' as never }
    try {
      await sdk.claims.create(bad)
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError)
      expect((err as ValidationError).fields.claimType).toBeTruthy()
    }
  })

  test('optional diagnosisCode is stored', async () => {
    const claim = await sdk.claims.create({ ...VALID_CLAIM, diagnosisCode: 'J18.9' })
    expect(claim.diagnosisCode).toBe('J18.9')
  })
})

// ── Claims: get ────────────────────────────────────────────────────────────

describe('claims.get()', () => {
  test('returns correct claim by ID', async () => {
    const created = await sdk.claims.create(VALID_CLAIM)
    const fetched = await sdk.claims.get(created.id)
    expect(fetched.id).toBe(created.id)
    expect(fetched.policyId).toBe(VALID_CLAIM.policyId)
  })

  test('unknown ID throws ApiError with statusCode 404', async () => {
    await expect(sdk.claims.get('non-existent-id')).rejects.toThrow(ApiError)
    try {
      await sdk.claims.get('non-existent-id')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).statusCode).toBe(404)
    }
  })
})

// ── Claims: list ───────────────────────────────────────────────────────────

describe('claims.list()', () => {
  test('returns paginated result structure', async () => {
    const result = await sdk.claims.list()
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('page')
    expect(result).toHaveProperty('pageSize')
    expect(result).toHaveProperty('totalPages')
    expect(Array.isArray(result.data)).toBe(true)
  })

  test('status filter returns only matching claims', async () => {
    await sdk.claims.create(VALID_CLAIM)
    await sdk.claims.create({ ...VALID_CLAIM, policyId: 'POL-002' })

    const result = await sdk.claims.list({ status: 'PENDING' })
    expect(result.data.length).toBeGreaterThan(0)
    result.data.forEach((c) => expect(c.status).toBe('PENDING'))
  })

  test('pageSize limits results', async () => {
    await sdk.claims.create(VALID_CLAIM)
    await sdk.claims.create({ ...VALID_CLAIM, policyId: 'POL-002' })
    await sdk.claims.create({ ...VALID_CLAIM, policyId: 'POL-003' })

    const result = await sdk.claims.list({ pageSize: 2 })
    expect(result.data.length).toBeLessThanOrEqual(2)
    expect(result.pageSize).toBe(2)
  })

  test('page 2 returns different results than page 1', async () => {
    for (let i = 0; i < 4; i++) {
      await sdk.claims.create({ ...VALID_CLAIM, policyId: `POL-${i}` })
    }
    const page1 = await sdk.claims.list({ page: 1, pageSize: 2 })
    const page2 = await sdk.claims.list({ page: 2, pageSize: 2 })
    const ids1 = page1.data.map((c) => c.id)
    const ids2 = page2.data.map((c) => c.id)
    expect(ids1).not.toEqual(ids2)
  })
})

// ── Documents ──────────────────────────────────────────────────────────────

describe('documents.upload()', () => {
  test('uploads buffer and returns document with ID', async () => {
    const claim = await sdk.claims.create(VALID_CLAIM)
    const buffer = Buffer.from('fake pdf content')

    const doc = await sdk.documents.upload(claim.id, buffer, {
      type: 'MEDICAL_RECEIPT',
      fileName: 'receipt.pdf',
    })

    expect(doc.id).toBeTruthy()
    expect(doc.claimId).toBe(claim.id)
    expect(doc.type).toBe('MEDICAL_RECEIPT')
    expect(doc.fileName).toBe('receipt.pdf')
  })

  test('onProgress called during upload', async () => {
    const claim = await sdk.claims.create(VALID_CLAIM)
    const buffer = Buffer.from('content')
    const progressValues: number[] = []

    await sdk.documents.upload(claim.id, buffer, {
      type: 'PRESCRIPTION',
      fileName: 'rx.pdf',
      onProgress: (pct) => progressValues.push(pct),
    })

    expect(progressValues.length).toBeGreaterThan(0)
    expect(progressValues[progressValues.length - 1]).toBe(100)
  })

  test('upload to unknown claim throws ApiError 404', async () => {
    const buffer = Buffer.from('content')
    await expect(
      sdk.documents.upload('non-existent', buffer, { type: 'MEDICAL_RECEIPT', fileName: 'f.pdf' })
    ).rejects.toThrow(ApiError)

    try {
      await sdk.documents.upload('non-existent', buffer, { type: 'MEDICAL_RECEIPT', fileName: 'f.pdf' })
    } catch (err) {
      expect((err as ApiError).statusCode).toBe(404)
    }
  })

  test('lists documents for a claim', async () => {
    const claim = await sdk.claims.create(VALID_CLAIM)
    await sdk.documents.upload(claim.id, Buffer.from('doc1'), { type: 'MEDICAL_RECEIPT', fileName: 'r1.pdf' })
    await sdk.documents.upload(claim.id, Buffer.from('doc2'), { type: 'PRESCRIPTION', fileName: 'rx.pdf' })

    const docs = await sdk.claims.listDocuments(claim.id)
    expect(docs.length).toBe(2)
  })
})

// ── onStatusChange ────────────────────────────────────────────────────────

describe('claims.onStatusChange()', () => {
  test('callback fires when status changes', async () => {
    const claim = await sdk.claims.create(VALID_CLAIM)
    const statusChanges: string[] = []

    const unsubscribe = sdk.claims.onStatusChange(claim.id, (newStatus) => {
      statusChanges.push(newStatus)
    })

    // Let initial poll run first (sets lastStatus = PENDING)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Update status via test endpoint (needs real JWT)
    await request(app)
      .patch(`/api/v1/claims/${claim.id}/status`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ status: 'UNDER_REVIEW' })

    // Wait for next poll cycle (5s interval)
    await new Promise((resolve) => setTimeout(resolve, 6000))

    unsubscribe()

    expect(statusChanges.length).toBeGreaterThan(0)
    expect(statusChanges).toContain('UNDER_REVIEW')
  }, 12000)

  test('unsubscribe stops polling', async () => {
    const claim = await sdk.claims.create(VALID_CLAIM)
    let callCount = 0

    const unsubscribe = sdk.claims.onStatusChange(claim.id, () => {
      callCount++
    })

    unsubscribe()

    // No status changes should be detected after unsubscribe
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(callCount).toBe(0)
  })
})

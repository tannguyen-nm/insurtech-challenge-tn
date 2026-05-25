import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { claims } from '../store'
import type { Claim, ClaimStatus, ClaimType } from '../../src/types'

const router = Router()
const VALID_CLAIM_TYPES: ClaimType[] = ['OUTPATIENT', 'INPATIENT', 'DENTAL']
const VALID_STATUSES: ClaimStatus[] = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID']

router.post('/', (req, res) => {
  const { policyId, claimType, amount, currency, description, treatmentDate, providerName, diagnosisCode } =
    req.body as Partial<Claim>

  const errors: Record<string, string> = {}
  if (!policyId) errors.policyId = 'required'
  if (!claimType || !VALID_CLAIM_TYPES.includes(claimType)) {
    errors.claimType = 'must be OUTPATIENT, INPATIENT, or DENTAL'
  }
  if (amount === undefined || amount === null) {
    errors.amount = 'required'
  } else if (typeof amount !== 'number' || amount <= 0) {
    errors.amount = 'must be a positive number'
  }
  if (!description) errors.description = 'required'
  if (!treatmentDate) errors.treatmentDate = 'required'
  if (!providerName) errors.providerName = 'required'

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ errors })
    return
  }

  const now = new Date().toISOString()
  const claim: Claim = {
    id: uuid(),
    policyId: policyId!,
    claimType: claimType!,
    status: 'PENDING',
    amount: amount!,
    currency: (currency as string) ?? 'USD',
    description: description!,
    treatmentDate: treatmentDate!,
    providerName: providerName!,
    diagnosisCode: diagnosisCode as string | undefined,
    submittedAt: now,
    updatedAt: now,
  }

  claims.set(claim.id, claim)
  res.status(201).json(claim)
})

router.get('/', (req, res) => {
  const { status, page = '1', pageSize = '20' } = req.query as Record<string, string>

  let all = Array.from(claims.values())

  if (status) {
    if (!VALID_STATUSES.includes(status as ClaimStatus)) {
      res.status(400).json({ errors: { status: `must be one of: ${VALID_STATUSES.join(', ')}` } })
      return
    }
    all = all.filter((c) => c.status === status)
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
  const total = all.length
  const start = (pageNum - 1) * pageSizeNum
  const data = all.slice(start, start + pageSizeNum)

  res.json({
    data,
    total,
    page: pageNum,
    pageSize: pageSizeNum,
    totalPages: Math.ceil(total / pageSizeNum),
  })
})

router.get('/:id', (req, res) => {
  const claim = claims.get(req.params.id)
  if (!claim) {
    res.status(404).json({ error: 'Claim not found' })
    return
  }
  res.json(claim)
})

// Test helper: update claim status (in test mode)
router.patch('/:id/status', (req, res) => {
  if (process.env.NODE_ENV !== 'test') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  const claim = claims.get(req.params.id)
  if (!claim) {
    res.status(404).json({ error: 'Claim not found' })
    return
  }
  const { status } = req.body as { status: ClaimStatus }
  const updated = { ...claim, status, updatedAt: new Date().toISOString() }
  claims.set(claim.id, updated)
  res.json(updated)
})

export default router

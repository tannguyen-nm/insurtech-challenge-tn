import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import multer from 'multer'
import { claims, documents } from '../store'
import type { ClaimDocument, DocumentType } from '../../src/types'

const router = Router({ mergeParams: true })
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
})

const VALID_DOC_TYPES: DocumentType[] = [
  'MEDICAL_RECEIPT',
  'PRESCRIPTION',
  'DISCHARGE_SUMMARY',
  'ITEMIZED_BILL',
  'DENTAL_RECEIPT',
  'TREATMENT_PLAN',
]

router.post('/', upload.single('file'), (req, res) => {
  const { claimId } = req.params as { claimId: string }

  if (!claims.has(claimId)) {
    res.status(404).json({ error: 'Claim not found' })
    return
  }

  const { type } = req.body as { type?: string }
  const errors: Record<string, string> = {}

  if (!type || !VALID_DOC_TYPES.includes(type as DocumentType)) {
    errors.type = `must be one of: ${VALID_DOC_TYPES.join(', ')}`
  }
  if (!req.file) {
    errors.file = 'required'
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ errors })
    return
  }

  const doc: ClaimDocument = {
    id: uuid(),
    claimId,
    type: type as DocumentType,
    fileName: req.file!.originalname,
    fileSize: req.file!.size,
    uploadedAt: new Date().toISOString(),
  }

  documents.set(doc.id, doc)
  res.status(201).json(doc)
})

router.get('/', (req, res) => {
  const { claimId } = req.params as { claimId: string }

  if (!claims.has(claimId)) {
    res.status(404).json({ error: 'Claim not found' })
    return
  }

  const docs = Array.from(documents.values()).filter((d) => d.claimId === claimId)
  res.json(docs)
})

export default router

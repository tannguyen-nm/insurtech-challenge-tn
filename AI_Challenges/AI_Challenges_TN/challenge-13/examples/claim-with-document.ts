/**
 * Example 2: Submit an inpatient claim with document upload
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { InsuranceSDK, ValidationError } from '../src'

async function main() {
  const sdk = new InsuranceSDK({
    apiKey: 'test-api-key',
    environment: 'sandbox',
    baseUrl: 'http://localhost:3000',
  })

  try {
    // 1. Submit claim
    const claim = await sdk.claims.create({
      policyId: 'POL-2024-005678',
      claimType: 'INPATIENT',
      amount: 12500.0,
      description: 'Appendectomy — 3-day hospital stay',
      treatmentDate: '2024-01-10',
      providerName: 'Metropolitan General Hospital',
      diagnosisCode: 'K35.80',
    })

    console.log(`✓ Claim created: ${claim.id} (${claim.status})`)

    // 2. Upload discharge summary (mock buffer)
    const mockPdf = Buffer.from('%PDF-1.4 mock discharge summary content')

    console.log('\nUploading discharge summary...')
    const doc1 = await sdk.documents.upload(claim.id, mockPdf, {
      type: 'DISCHARGE_SUMMARY',
      fileName: 'discharge-summary.pdf',
      onProgress: (pct) => process.stdout.write(`\r  Progress: ${pct}%`),
    })
    console.log(`\n✓ Document uploaded: ${doc1.id} (${doc1.fileName})`)

    // 3. Upload itemized bill
    console.log('\nUploading itemized bill...')
    const mockBill = Buffer.from('ITEMIZED BILL: Room: 3000, Surgery: 8000, Meds: 1500')
    const doc2 = await sdk.documents.upload(claim.id, mockBill, {
      type: 'ITEMIZED_BILL',
      fileName: 'itemized-bill.pdf',
      onProgress: (pct) => process.stdout.write(`\r  Progress: ${pct}%`),
    })
    console.log(`\n✓ Document uploaded: ${doc2.id} (${doc2.fileName})`)

    // 4. List uploaded documents
    const docs = await sdk.claims.listDocuments(claim.id)
    console.log(`\n✓ Total documents for claim: ${docs.length}`)
  } catch (err) {
    if (err instanceof ValidationError) {
      console.error('Validation failed:', err.fields)
    } else {
      throw err
    }
  }
}

main().catch(console.error)

/**
 * Example 1: Submit a claim and poll for status
 */
import { InsuranceSDK } from '../src'

async function main() {
  const sdk = new InsuranceSDK({
    apiKey: 'test-api-key',
    environment: 'sandbox',
    baseUrl: 'http://localhost:3000',
  })

  console.log('Submitting outpatient claim...')

  const claim = await sdk.claims.create({
    policyId: 'POL-2024-001234',
    claimType: 'OUTPATIENT',
    amount: 450.0,
    description: 'GP consultation and blood tests',
    treatmentDate: '2024-01-15',
    providerName: 'City Medical Centre',
    diagnosisCode: 'J06.9',
  })

  console.log(`✓ Claim submitted: ${claim.id}`)
  console.log(`  Status: ${claim.status}`)
  console.log(`  Amount: ${claim.currency} ${claim.amount}`)

  console.log('\nFetching claim by ID...')
  const fetched = await sdk.claims.get(claim.id)
  console.log(`  Retrieved: ${fetched.id} — ${fetched.status}`)

  console.log('\nListing all PENDING claims...')
  const list = await sdk.claims.list({ status: 'PENDING', pageSize: 5 })
  console.log(`  Found ${list.total} pending claim(s)`)
}

main().catch(console.error)

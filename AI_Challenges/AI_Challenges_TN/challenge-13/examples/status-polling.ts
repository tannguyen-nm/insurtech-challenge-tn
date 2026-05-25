/**
 * Example 3: Poll for claim status changes using onStatusChange()
 */
import { InsuranceSDK } from '../src'
import type { ClaimStatus, Claim } from '../src'

async function main() {
  const sdk = new InsuranceSDK({
    apiKey: 'test-api-key',
    environment: 'sandbox',
    baseUrl: 'http://localhost:3000',
  })

  const claim = await sdk.claims.create({
    policyId: 'POL-2024-009999',
    claimType: 'DENTAL',
    amount: 800.0,
    description: 'Root canal treatment',
    treatmentDate: '2024-01-20',
    providerName: 'Smile Dental Clinic',
    diagnosisCode: 'K04.0',
  })

  console.log(`✓ Claim submitted: ${claim.id} — initial status: ${claim.status}`)
  console.log('Listening for status changes (polls every 5s)...\n')

  const unsubscribe = sdk.claims.onStatusChange(
    claim.id,
    (newStatus: ClaimStatus, updatedClaim: Claim) => {
      console.log(`\n🔔 Status changed!`)
      console.log(`   ${updatedClaim.status}`)
      console.log(`   Updated at: ${updatedClaim.updatedAt}`)

      if (newStatus === 'APPROVED' || newStatus === 'REJECTED' || newStatus === 'PAID') {
        console.log('\n✓ Terminal status reached. Stopping poll.')
        unsubscribe()
        process.exit(0)
      }
    }
  )

  // Stop after 30 seconds if no terminal status
  setTimeout(() => {
    console.log('\nTimeout reached. Stopping poll.')
    unsubscribe()
    process.exit(0)
  }, 30_000)
}

main().catch(console.error)

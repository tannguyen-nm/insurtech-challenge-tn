import type { Claim, ClaimDocument } from '../src/types'

export const claims = new Map<string, Claim>()
export const documents = new Map<string, ClaimDocument>()

export const VALID_API_KEYS = new Set([
  'test-api-key',
  'sandbox-api-key-123',
  'partner-key-456',
])

// Test-only: force next N non-auth requests to return 503
export let force503Remaining = 0
export function setForce503(count: number): void {
  force503Remaining = count
}
export function consumeForce503(): boolean {
  if (force503Remaining > 0) {
    force503Remaining--
    return true
  }
  return false
}

export function clearAll(): void {
  claims.clear()
  documents.clear()
  force503Remaining = 0
}

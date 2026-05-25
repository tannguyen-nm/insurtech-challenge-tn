import { z } from 'zod'
import { ValidationError } from '../errors'
import { withRetry } from '../retry'
import type { HttpClient } from '../HttpClient'
import type {
  Claim,
  ClaimDocument,
  ClaimListFilters,
  CreateClaimInput,
  PaginatedResult,
  StatusChangeCallback,
} from '../types'

const createClaimSchema = z.object({
  policyId: z.string().min(1, 'required'),
  claimType: z.enum(['OUTPATIENT', 'INPATIENT', 'DENTAL'], {
    errorMap: () => ({ message: 'must be OUTPATIENT, INPATIENT, or DENTAL' }),
  }),
  amount: z.number({ invalid_type_error: 'must be a number' }).positive('must be positive'),
  currency: z.string().length(3).optional(),
  description: z.string().min(1, 'required'),
  treatmentDate: z.string().min(1, 'required'),
  providerName: z.string().min(1, 'required'),
  diagnosisCode: z.string().optional(),
})

export class ClaimsNamespace {
  private pollingIntervals = new Map<string, ReturnType<typeof setInterval>>()

  constructor(private http: HttpClient) {}

  async create(data: CreateClaimInput): Promise<Claim> {
    const result = createClaimSchema.safeParse(data)
    if (!result.success) {
      const fields: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join('.') || 'unknown'
        fields[key] = issue.message
      })
      throw new ValidationError(fields)
    }

    return withRetry(() => this.http.post<Claim>('/api/v1/claims', result.data))
  }

  async get(claimId: string): Promise<Claim> {
    return withRetry(() => this.http.get<Claim>(`/api/v1/claims/${claimId}`))
  }

  async list(filters?: ClaimListFilters): Promise<PaginatedResult<Claim>> {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.page !== undefined) params.set('page', String(filters.page))
    if (filters?.pageSize !== undefined) params.set('pageSize', String(filters.pageSize))
    const qs = params.toString()
    return withRetry(() =>
      this.http.get<PaginatedResult<Claim>>(`/api/v1/claims${qs ? `?${qs}` : ''}`)
    )
  }

  async listDocuments(claimId: string): Promise<ClaimDocument[]> {
    return withRetry(() => this.http.get<ClaimDocument[]>(`/api/v1/claims/${claimId}/documents`))
  }

  onStatusChange(claimId: string, callback: StatusChangeCallback): () => void {
    let lastStatus: string | null = null

    const poll = async () => {
      try {
        const claim = await this.get(claimId)
        if (lastStatus !== null && claim.status !== lastStatus) {
          callback(claim.status, claim)
        }
        lastStatus = claim.status
      } catch {
        // Silently ignore transient poll errors
      }
    }

    poll()
    const interval = setInterval(poll, 5_000)
    this.pollingIntervals.set(claimId, interval)

    return () => {
      const iv = this.pollingIntervals.get(claimId)
      if (iv !== undefined) {
        clearInterval(iv)
        this.pollingIntervals.delete(claimId)
      }
    }
  }
}

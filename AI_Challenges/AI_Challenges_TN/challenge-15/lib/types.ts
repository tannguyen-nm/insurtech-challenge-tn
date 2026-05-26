export const CLAIM_TYPES = ['OUTPATIENT', 'INPATIENT', 'DENTAL', 'LIFE', 'MATERNITY', 'OPTICAL'] as const
export const NOTIFICATION_EVENTS = [
  'CLAIM_SUBMITTED',
  'CLAIM_APPROVED',
  'CLAIM_REJECTED',
  'PAYMENT_SENT',
  'DOCUMENT_REQUESTED',
  'SLA_BREACH',
] as const
export const CHANNELS = ['EMAIL', 'SMS', 'WEBHOOK', 'IN_APP'] as const

export type ClaimType = (typeof CLAIM_TYPES)[number]
export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number]
export type Channel = (typeof CHANNELS)[number]
export type CustomFieldType = 'text' | 'number' | 'select'

export interface ClaimTypeConfig {
  enabled: boolean
  requiredDocs: string[]
  optionalDocs: string[]
}

export interface ApprovalTier {
  maxAmount: number
  requiredRole: string
}

export interface NotificationConfig {
  channels: Channel[]
  customTemplate?: string
}

export interface SLAConfig {
  targetBusinessDays: number
  escalateTo: string
}

export interface CustomField {
  name: string
  required: boolean
  type: CustomFieldType
  options?: string[]
}

export interface TenantConfig {
  tenantId: string
  name: string
  branding: {
    primaryColor: string
    secondaryColor: string
    logoUrl?: string
  }
  claimTypes: Record<ClaimType, ClaimTypeConfig>
  approvalRules: {
    autoApprovalThreshold: number
    tiers: ApprovalTier[]
  }
  notifications: Record<ClaimType, Record<NotificationEvent, NotificationConfig>>
  sla: Record<ClaimType, SLAConfig>
  customFields: CustomField[]
}

export interface TenantVersion {
  version: number
  config: TenantConfig
  savedAt: string
  savedBy: string
}

export interface TenantSummary {
  tenantId: string
  name: string
  enabledClaimTypes: ClaimType[]
  lastModified: string
  version: number
}

export interface ProcessClaimInput {
  tenantId: string
  claimType: ClaimType
  amount: number
  submissionDate: string
  documents: string[]
}

export interface ApprovalRouting {
  autoApproved?: true
  tier?: number
  requiredRole?: string
}

export interface ProcessClaimResult {
  requiredDocuments: string[]
  missingDocuments: string[]
  optionalDocuments: string[]
  approvalRouting: ApprovalRouting
  notifications: Array<{ event: string; channels: string[] }>
  slaDeadline: string
  slaBusinessDays: number
  customFieldsRequired: CustomField[]
  errors: string[]
}

export interface DiffEntry {
  path: string
  valueA: unknown
  valueB: unknown
  equal: boolean
}

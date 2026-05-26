import type { TenantConfig, TenantVersion, ClaimType, NotificationEvent, Channel } from './types'
import { CLAIM_TYPES, NOTIFICATION_EVENTS } from './types'

function makeVersion(config: TenantConfig): TenantVersion {
  return { version: 1, config, savedAt: new Date().toISOString(), savedBy: 'system' }
}

function disabledType() {
  return { enabled: false, requiredDocs: [], optionalDocs: [] }
}

type NotifMap = Record<ClaimType, Record<NotificationEvent, { channels: Channel[]; customTemplate?: string }>>

function buildNotifications(
  enabledTypes: ClaimType[],
  perEvent: Partial<Record<NotificationEvent, Channel[]>>,
  defaultChannels: Channel[]
): NotifMap {
  const allTypes = CLAIM_TYPES
  return Object.fromEntries(
    allTypes.map(t => [
      t,
      Object.fromEntries(
        NOTIFICATION_EVENTS.map(e => [
          e,
          { channels: enabledTypes.includes(t) ? (perEvent[e] ?? defaultChannels) : [] },
        ])
      ),
    ])
  ) as NotifMap
}

function allSla(targetBusinessDays: number, escalateTo: string): TenantConfig['sla'] {
  return Object.fromEntries(
    CLAIM_TYPES.map(t => [t, { targetBusinessDays, escalateTo }])
  ) as TenantConfig['sla']
}

// Tenant A — SafeGuard Insurance (Corporate)
// OUTPATIENT, INPATIENT, DENTAL · auto-approval 20,000 · 3-tier · email only · SLA 5d/10d · Employee ID
const safeguard: TenantConfig = {
  tenantId: 'safeguard',
  name: 'SafeGuard Insurance',
  branding: { primaryColor: '#1e40af', secondaryColor: '#3b82f6' },
  claimTypes: {
    OUTPATIENT: {
      enabled: true,
      requiredDocs: ['Medical Receipt', 'Doctor Consultation Note'],
      optionalDocs: ['Lab Results', 'Referral Letter'],
    },
    INPATIENT: {
      enabled: true,
      requiredDocs: ['Hospital Discharge Summary', 'Itemized Bill', 'Admission Record'],
      optionalDocs: ['Specialist Report'],
    },
    DENTAL: {
      enabled: true,
      requiredDocs: ['Dental Receipt', 'Treatment Plan'],
      optionalDocs: ['Dental X-Ray'],
    },
    LIFE: disabledType(),
    MATERNITY: disabledType(),
    OPTICAL: disabledType(),
  },
  approvalRules: {
    autoApprovalThreshold: 20000,
    tiers: [
      { maxAmount: 50000, requiredRole: 'Assessor' },
      { maxAmount: 200000, requiredRole: 'Team Lead' },
      { maxAmount: 999999, requiredRole: 'Director' },
    ],
  },
  notifications: buildNotifications(
    ['OUTPATIENT', 'INPATIENT', 'DENTAL'],
    {
      CLAIM_SUBMITTED: ['EMAIL'],
      CLAIM_APPROVED: ['EMAIL'],
      CLAIM_REJECTED: ['EMAIL'],
      PAYMENT_SENT: ['EMAIL'],
      DOCUMENT_REQUESTED: ['EMAIL'],
      SLA_BREACH: ['EMAIL'],
    },
    ['EMAIL']
  ),
  sla: {
    OUTPATIENT: { targetBusinessDays: 5, escalateTo: 'claims@safeguard-ins.com' },
    INPATIENT: { targetBusinessDays: 10, escalateTo: 'claims@safeguard-ins.com' },
    DENTAL: { targetBusinessDays: 5, escalateTo: 'dental@safeguard-ins.com' },
    LIFE: { targetBusinessDays: 14, escalateTo: 'claims@safeguard-ins.com' },
    MATERNITY: { targetBusinessDays: 7, escalateTo: 'claims@safeguard-ins.com' },
    OPTICAL: { targetBusinessDays: 5, escalateTo: 'claims@safeguard-ins.com' },
  },
  customFields: [
    { name: 'Employee ID', required: true, type: 'text' },
  ],
}

// Tenant B — HealthFirst (Retail)
// OUTPATIENT, INPATIENT, DENTAL, MATERNITY, OPTICAL · auto-approval 5,000 · 2-tier
// email + SMS (member-facing events); INPATIENT adds WEBHOOK for hospital integration
const healthfirst: TenantConfig = {
  tenantId: 'healthfirst',
  name: 'HealthFirst',
  branding: { primaryColor: '#15803d', secondaryColor: '#22c55e' },
  claimTypes: {
    OUTPATIENT: {
      enabled: true,
      requiredDocs: ['Medical Receipt', 'Doctor Note'],
      optionalDocs: ['Lab Results'],
    },
    INPATIENT: {
      enabled: true,
      requiredDocs: ['Hospital Discharge Summary', 'Itemized Bill'],
      optionalDocs: ['Specialist Report'],
    },
    DENTAL: {
      enabled: true,
      requiredDocs: ['Dental Receipt', 'Treatment Plan'],
      optionalDocs: ['Dental X-Ray'],
    },
    LIFE: disabledType(),
    MATERNITY: {
      enabled: true,
      requiredDocs: ['Obstetric Record', 'Hospital Delivery Receipt'],
      optionalDocs: ['Prenatal Visit Records'],
    },
    OPTICAL: {
      enabled: true,
      requiredDocs: ['Optical Receipt', 'Prescription from Optometrist'],
      optionalDocs: [],
    },
  },
  approvalRules: {
    autoApprovalThreshold: 5000,
    tiers: [
      { maxAmount: 30000, requiredRole: 'Assessor' },
      { maxAmount: 999999, requiredRole: 'Manager' },
    ],
  },
  notifications: (() => {
    const base = buildNotifications(
      ['OUTPATIENT', 'DENTAL', 'MATERNITY', 'OPTICAL'],
      {
        CLAIM_SUBMITTED: ['EMAIL'],
        CLAIM_APPROVED: ['EMAIL', 'SMS'],
        CLAIM_REJECTED: ['EMAIL', 'SMS'],
        PAYMENT_SENT: ['EMAIL', 'SMS'],
        DOCUMENT_REQUESTED: ['EMAIL', 'SMS'],
        SLA_BREACH: ['EMAIL'],
      },
      ['EMAIL', 'SMS']
    )
    // INPATIENT gets webhook in addition (hospital system integration)
    NOTIFICATION_EVENTS.forEach(e => {
      base['INPATIENT'][e].channels = e === 'SLA_BREACH'
        ? ['EMAIL', 'WEBHOOK']
        : ['EMAIL', 'SMS', 'WEBHOOK']
    })
    return base
  })(),
  sla: allSla(7, 'ops@healthfirst.com'),
  customFields: [],
}

// Tenant C — GovHealth (Government)
// OUTPATIENT, INPATIENT · auto-approval 0 · committee single-tier
// email + webhook (all events feed audit system)
const govhealth: TenantConfig = {
  tenantId: 'govhealth',
  name: 'GovHealth',
  branding: { primaryColor: '#7c3aed', secondaryColor: '#a78bfa' },
  claimTypes: {
    OUTPATIENT: {
      enabled: true,
      requiredDocs: ['Medical Receipt', 'Doctor Note', 'Pre-Authorization Code', 'National ID'],
      optionalDocs: ['Specialist Referral'],
    },
    INPATIENT: {
      enabled: true,
      requiredDocs: ['Hospital Discharge Summary', 'Itemized Bill', 'Admission Authorization', 'National ID'],
      optionalDocs: ['Surgery Report'],
    },
    DENTAL: disabledType(),
    LIFE: disabledType(),
    MATERNITY: disabledType(),
    OPTICAL: disabledType(),
  },
  approvalRules: {
    autoApprovalThreshold: 0,
    tiers: [
      { maxAmount: 999999, requiredRole: 'Committee' },
    ],
  },
  notifications: buildNotifications(
    ['OUTPATIENT', 'INPATIENT'],
    {
      CLAIM_SUBMITTED: ['EMAIL', 'WEBHOOK'],
      CLAIM_APPROVED: ['EMAIL', 'WEBHOOK'],
      CLAIM_REJECTED: ['EMAIL', 'WEBHOOK'],
      PAYMENT_SENT: ['EMAIL', 'WEBHOOK'],
      DOCUMENT_REQUESTED: ['EMAIL'],
      SLA_BREACH: ['EMAIL', 'WEBHOOK'],
    },
    ['EMAIL', 'WEBHOOK']
  ),
  sla: allSla(15, 'claims@govhealth.gov'),
  customFields: [
    { name: 'Department', required: true, type: 'text' },
    { name: 'Budget Code', required: true, type: 'text' },
  ],
}

export function seedStore(store: Map<string, TenantVersion[]>): void {
  store.set('safeguard', [makeVersion(safeguard)])
  store.set('healthfirst', [makeVersion(healthfirst)])
  store.set('govhealth', [makeVersion(govhealth)])
}

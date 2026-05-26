import type { TenantConfig, TenantVersion } from './types'
import { CLAIM_TYPES, NOTIFICATION_EVENTS } from './types'

function makeVersion(config: TenantConfig): TenantVersion {
  return { version: 1, config, savedAt: new Date().toISOString(), savedBy: 'system' }
}

function disabledType() {
  return { enabled: false, requiredDocs: [], optionalDocs: [] }
}

function allNotifications(channels: TenantConfig['notifications'][keyof TenantConfig['notifications']]['channels']): TenantConfig['notifications'] {
  return Object.fromEntries(
    NOTIFICATION_EVENTS.map(e => [e, { channels }])
  ) as TenantConfig['notifications']
}

function allSla(targetBusinessDays: number, escalateTo: string): TenantConfig['sla'] {
  return Object.fromEntries(
    CLAIM_TYPES.map(t => [t, { targetBusinessDays, escalateTo }])
  ) as TenantConfig['sla']
}

// Tenant A — SafeGuard Insurance (Corporate)
// OUTPATIENT, INPATIENT, DENTAL · auto-approval 20,000 · 3-tier (assessor → team lead → director)
// email only · SLA 5d outpatient, 10d inpatient · custom field: Employee ID
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
  notifications: allNotifications(['EMAIL']),
  sla: {
    OUTPATIENT: { targetBusinessDays: 5, escalateTo: 'claims@safeguard-ins.com' },
    INPATIENT: { targetBusinessDays: 10, escalateTo: 'claims@safeguard-ins.com' },
    DENTAL: { targetBusinessDays: 5, escalateTo: 'claims@safeguard-ins.com' },
    LIFE: { targetBusinessDays: 14, escalateTo: 'claims@safeguard-ins.com' },
    MATERNITY: { targetBusinessDays: 7, escalateTo: 'claims@safeguard-ins.com' },
    OPTICAL: { targetBusinessDays: 5, escalateTo: 'claims@safeguard-ins.com' },
  },
  customFields: [
    { name: 'Employee ID', required: true, type: 'text' },
  ],
}

// Tenant B — HealthFirst (Retail)
// OUTPATIENT, INPATIENT, DENTAL, MATERNITY, OPTICAL · auto-approval 5,000 · 2-tier (assessor → manager)
// email + SMS · SLA 7 days all types · no custom fields
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
  notifications: allNotifications(['EMAIL', 'SMS']),
  sla: allSla(7, 'ops@healthfirst.com'),
  customFields: [],
}

// Tenant C — GovHealth (Government)
// OUTPATIENT, INPATIENT only · auto-approval 0 (all manual) · single-tier (committee)
// email + webhook · SLA 15 days all types · custom fields: Department (required), Budget Code (required)
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
  notifications: allNotifications(['EMAIL', 'WEBHOOK']),
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

import type { TenantConfig, TenantVersion } from './types'

function makeVersion(config: TenantConfig): TenantVersion {
  return { version: 1, config, savedAt: new Date().toISOString(), savedBy: 'system' }
}

const safeguard: TenantConfig = {
  tenantId: 'safeguard',
  name: 'SafeGuard Insurance',
  branding: { primaryColor: '#1e40af', secondaryColor: '#3b82f6' },
  claimTypes: {
    OUTPATIENT: {
      enabled: true,
      requiredDocs: ['Medical Receipt', 'Prescription'],
      optionalDocs: ['Lab Results', 'Referral Letter'],
    },
    INPATIENT: {
      enabled: true,
      requiredDocs: ['Discharge Summary', 'Itemized Bill', 'Medical Receipt'],
      optionalDocs: ['Specialist Report'],
    },
    DENTAL: {
      enabled: true,
      requiredDocs: ['Dental Receipt', 'Treatment Plan'],
      optionalDocs: ['X-Ray Report'],
    },
    LIFE: {
      enabled: true,
      requiredDocs: ['Death Certificate', 'Policy Document', 'Beneficiary ID'],
      optionalDocs: ['Medical Examiner Report'],
    },
  },
  approvalRules: {
    autoApprovalThreshold: 5000,
    tiers: [
      { maxAmount: 10000, requiredRole: 'Claims Adjuster' },
      { maxAmount: 50000, requiredRole: 'Senior Adjuster' },
      { maxAmount: 200000, requiredRole: 'Claims Manager' },
    ],
  },
  notifications: {
    CLAIM_SUBMITTED: { channels: ['EMAIL', 'IN_APP'] },
    CLAIM_APPROVED: { channels: ['EMAIL', 'SMS', 'IN_APP'] },
    CLAIM_REJECTED: { channels: ['EMAIL', 'IN_APP'] },
    PAYMENT_SENT: { channels: ['EMAIL', 'SMS'] },
    DOCUMENT_REQUESTED: { channels: ['EMAIL', 'IN_APP'] },
    SLA_BREACH: { channels: ['EMAIL', 'WEBHOOK'] },
  },
  sla: {
    OUTPATIENT: { targetBusinessDays: 3, escalateTo: 'claims-manager@safeguard.com' },
    INPATIENT: { targetBusinessDays: 5, escalateTo: 'claims-manager@safeguard.com' },
    DENTAL: { targetBusinessDays: 3, escalateTo: 'dental-team@safeguard.com' },
    LIFE: { targetBusinessDays: 10, escalateTo: 'life-team@safeguard.com' },
  },
  customFields: [
    { name: 'Policy Number', required: true, type: 'text' },
    { name: 'Network Provider', required: false, type: 'select', options: ['In-Network', 'Out-of-Network'] },
  ],
}

const healthfirst: TenantConfig = {
  tenantId: 'healthfirst',
  name: 'HealthFirst HMO',
  branding: { primaryColor: '#15803d', secondaryColor: '#22c55e' },
  claimTypes: {
    OUTPATIENT: {
      enabled: true,
      requiredDocs: ['Medical Receipt', 'Doctor Note'],
      optionalDocs: ['Lab Results'],
    },
    INPATIENT: {
      enabled: false,
      requiredDocs: [],
      optionalDocs: [],
    },
    DENTAL: {
      enabled: true,
      requiredDocs: ['Dental Receipt'],
      optionalDocs: ['Dental X-Ray'],
    },
    LIFE: {
      enabled: false,
      requiredDocs: [],
      optionalDocs: [],
    },
  },
  approvalRules: {
    autoApprovalThreshold: 2000,
    tiers: [
      { maxAmount: 5000, requiredRole: 'Claims Representative' },
      { maxAmount: 20000, requiredRole: 'Claims Manager' },
    ],
  },
  notifications: {
    CLAIM_SUBMITTED: { channels: ['EMAIL'] },
    CLAIM_APPROVED: { channels: ['EMAIL', 'SMS'] },
    CLAIM_REJECTED: { channels: ['EMAIL'] },
    PAYMENT_SENT: { channels: ['EMAIL'] },
    DOCUMENT_REQUESTED: { channels: ['EMAIL', 'SMS'] },
    SLA_BREACH: { channels: ['EMAIL'] },
  },
  sla: {
    OUTPATIENT: { targetBusinessDays: 2, escalateTo: 'ops@healthfirst.com' },
    INPATIENT: { targetBusinessDays: 5, escalateTo: 'ops@healthfirst.com' },
    DENTAL: { targetBusinessDays: 4, escalateTo: 'dental@healthfirst.com' },
    LIFE: { targetBusinessDays: 14, escalateTo: 'ops@healthfirst.com' },
  },
  customFields: [
    { name: 'Doctor NPI', required: true, type: 'text' },
    { name: 'Primary Diagnosis Code', required: true, type: 'text' },
  ],
}

const govhealth: TenantConfig = {
  tenantId: 'govhealth',
  name: 'GovHealth Program',
  branding: { primaryColor: '#92400e', secondaryColor: '#f59e0b' },
  claimTypes: {
    OUTPATIENT: {
      enabled: true,
      requiredDocs: ['Medical Receipt', 'Doctor Note', 'Authorization Code', 'Patient ID'],
      optionalDocs: ['Specialist Referral'],
    },
    INPATIENT: {
      enabled: true,
      requiredDocs: ['Discharge Summary', 'Itemized Bill', 'Medical Receipt', 'Authorization Code', 'Admission Order'],
      optionalDocs: ['Surgical Report'],
    },
    DENTAL: {
      enabled: true,
      requiredDocs: ['Dental Receipt', 'Treatment Plan', 'Authorization Code'],
      optionalDocs: [],
    },
    LIFE: {
      enabled: true,
      requiredDocs: ['Death Certificate', 'Policy Document', 'Beneficiary ID', 'Coroner Report'],
      optionalDocs: [],
    },
  },
  approvalRules: {
    autoApprovalThreshold: 0,
    tiers: [
      { maxAmount: 500, requiredRole: 'Examiner Level 1' },
      { maxAmount: 5000, requiredRole: 'Senior Examiner' },
      { maxAmount: 50000, requiredRole: 'Program Director' },
    ],
  },
  notifications: {
    CLAIM_SUBMITTED: { channels: ['EMAIL', 'IN_APP', 'WEBHOOK'] },
    CLAIM_APPROVED: { channels: ['EMAIL', 'SMS', 'IN_APP', 'WEBHOOK'] },
    CLAIM_REJECTED: { channels: ['EMAIL', 'IN_APP', 'WEBHOOK'] },
    PAYMENT_SENT: { channels: ['EMAIL', 'SMS', 'WEBHOOK'] },
    DOCUMENT_REQUESTED: { channels: ['EMAIL', 'SMS', 'IN_APP'] },
    SLA_BREACH: { channels: ['EMAIL', 'SMS', 'WEBHOOK'] },
  },
  sla: {
    OUTPATIENT: { targetBusinessDays: 5, escalateTo: 'supervisor@govhealth.gov' },
    INPATIENT: { targetBusinessDays: 10, escalateTo: 'supervisor@govhealth.gov' },
    DENTAL: { targetBusinessDays: 7, escalateTo: 'dental-lead@govhealth.gov' },
    LIFE: { targetBusinessDays: 20, escalateTo: 'director@govhealth.gov' },
  },
  customFields: [
    { name: 'Patient SSN (last 4)', required: true, type: 'text' },
    { name: 'Authorization Code', required: true, type: 'text' },
    { name: 'Referring Physician', required: true, type: 'text' },
    { name: 'Claim Priority', required: false, type: 'select', options: ['Standard', 'Urgent', 'Emergency'] },
  ],
}

export function seedStore(store: Map<string, TenantVersion[]>): void {
  store.set('safeguard', [makeVersion(safeguard)])
  store.set('healthfirst', [makeVersion(healthfirst)])
  store.set('govhealth', [makeVersion(govhealth)])
}

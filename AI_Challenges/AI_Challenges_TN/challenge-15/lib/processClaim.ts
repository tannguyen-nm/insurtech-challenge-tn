import type { TenantConfig, ProcessClaimInput, ProcessClaimResult, ApprovalRouting } from './types'
import { addBusinessDays } from './utils'

export function processClaim(config: TenantConfig, input: ProcessClaimInput): ProcessClaimResult {
  const typeConfig = config.claimTypes[input.claimType]

  if (!typeConfig?.enabled) {
    return {
      requiredDocuments: [],
      missingDocuments: [],
      optionalDocuments: [],
      approvalRouting: {},
      notifications: [],
      slaDeadline: '',
      slaBusinessDays: 0,
      customFieldsRequired: [],
      errors: [`Claim type ${input.claimType} is not enabled for ${config.name}`],
    }
  }

  // Required / missing docs
  const submittedSet = new Set(input.documents.map((d) => d.toLowerCase().trim()))
  const missingDocuments = typeConfig.requiredDocs.filter(
    (d) => !submittedSet.has(d.toLowerCase().trim())
  )

  // Approval routing
  let approvalRouting: ApprovalRouting
  if (input.amount <= config.approvalRules.autoApprovalThreshold) {
    approvalRouting = { autoApproved: true }
  } else {
    const sorted = [...config.approvalRules.tiers].sort((a, b) => a.maxAmount - b.maxAmount)
    const matched = sorted.find((t) => input.amount <= t.maxAmount) ?? sorted[sorted.length - 1]
    const tierIndex = sorted.indexOf(matched) + 1
    approvalRouting = { tier: tierIndex, requiredRole: matched.requiredRole }
  }

  // Notifications
  const notifications = Object.entries(config.notifications).map(([event, cfg]) => ({
    event,
    channels: cfg.channels,
  }))

  // SLA
  const slaConfig = config.sla[input.claimType]
  const slaDeadline = addBusinessDays(input.submissionDate, slaConfig.targetBusinessDays)

  return {
    requiredDocuments: typeConfig.requiredDocs,
    missingDocuments,
    optionalDocuments: typeConfig.optionalDocs,
    approvalRouting,
    notifications,
    slaDeadline,
    slaBusinessDays: slaConfig.targetBusinessDays,
    customFieldsRequired: config.customFields,
    errors: [],
  }
}

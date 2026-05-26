import TenantForm from '@/components/TenantForm'
import { CLAIM_TYPES, NOTIFICATION_EVENTS } from '@/lib/types'
import type { TenantConfig } from '@/lib/types'

const defaultConfig: TenantConfig = {
  tenantId: '',
  name: '',
  branding: { primaryColor: '#1e40af', secondaryColor: '#3b82f6', logoUrl: '' },
  claimTypes: Object.fromEntries(
    CLAIM_TYPES.map((t) => [t, { enabled: false, requiredDocs: [], optionalDocs: [] }])
  ) as unknown as TenantConfig['claimTypes'],
  approvalRules: {
    autoApprovalThreshold: 1000,
    tiers: [{ maxAmount: 10000, requiredRole: 'Claims Manager' }],
  },
  notifications: Object.fromEntries(
    CLAIM_TYPES.map((t) => [
      t,
      Object.fromEntries(NOTIFICATION_EVENTS.map((e) => [e, { channels: ['EMAIL'] }])),
    ])
  ) as unknown as TenantConfig['notifications'],
  sla: Object.fromEntries(
    CLAIM_TYPES.map((t) => [t, { targetBusinessDays: 5, escalateTo: '' }])
  ) as unknown as TenantConfig['sla'],
  customFields: [],
}

export default function NewTenantPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">New Tenant</h1>
      <TenantForm defaultValues={defaultConfig} isNew />
    </div>
  )
}

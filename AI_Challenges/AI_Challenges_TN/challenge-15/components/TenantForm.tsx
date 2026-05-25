'use client'
import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import type { TenantConfig } from '@/lib/types'
import { BrandingTab } from './tabs/BrandingTab'
import { ClaimTypesTab } from './tabs/ClaimTypesTab'
import { ApprovalTab } from './tabs/ApprovalTab'
import { NotificationsTab } from './tabs/NotificationsTab'
import { SLATab } from './tabs/SLATab'
import { CustomFieldsTab } from './tabs/CustomFieldsTab'
import { PreviewTab } from './tabs/PreviewTab'
import { HistoryTab } from './tabs/HistoryTab'

type TabId = 'branding' | 'claimTypes' | 'approval' | 'notifications' | 'sla' | 'customFields' | 'preview' | 'history'

const TABS: { id: TabId; label: string; editOnly?: boolean }[] = [
  { id: 'branding', label: 'Branding' },
  { id: 'claimTypes', label: 'Claim Types' },
  { id: 'approval', label: 'Approval' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'sla', label: 'SLA' },
  { id: 'customFields', label: 'Custom Fields' },
  { id: 'preview', label: 'Preview' },
  { id: 'history', label: 'History', editOnly: true },
]

interface Props {
  defaultValues: TenantConfig
  isNew?: boolean
}

export default function TenantForm({ defaultValues, isNew }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('branding')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const methods = useForm<TenantConfig>({ defaultValues })

  const onSubmit = async (data: TenantConfig) => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const url = isNew ? '/api/tenants' : `/api/tenants/${defaultValues.tenantId}`
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error || 'Save failed')
      } else {
        const saved = await res.json()
        if (isNew) {
          router.push(`/tenants/${(saved as TenantConfig).tenantId}`)
        } else {
          setSuccess(true)
          router.refresh()
        }
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const visibleTabs = TABS.filter(t => !t.editOnly || !isNew)

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {visibleTabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-b-xl rounded-tr-xl border border-t-0 border-slate-200 p-6">
          {activeTab === 'branding' && <BrandingTab isNew={isNew} />}
          {activeTab === 'claimTypes' && <ClaimTypesTab />}
          {activeTab === 'approval' && <ApprovalTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'sla' && <SLATab />}
          {activeTab === 'customFields' && <CustomFieldsTab />}
          {activeTab === 'preview' && <PreviewTab />}
          {activeTab === 'history' && <HistoryTab tenantId={defaultValues.tenantId} />}
        </div>

        {activeTab !== 'history' && (
          <div className="flex items-center justify-between mt-4">
            <div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-600">Saved successfully.</p>}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : isNew ? 'Create Tenant' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </form>
    </FormProvider>
  )
}

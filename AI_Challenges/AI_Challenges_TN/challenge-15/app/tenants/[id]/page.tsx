import { notFound } from 'next/navigation'
import { store } from '@/lib/store'
import TenantForm from '@/components/TenantForm'

export default async function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const latest = store.getLatest(id)
  if (!latest) notFound()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{latest.config.name}</h1>
        <p className="text-sm text-slate-500 mt-1 font-mono">
          {latest.config.tenantId} · v{latest.version}
        </p>
      </div>
      <TenantForm defaultValues={latest.config} />
    </div>
  )
}

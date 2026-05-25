import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import type { TenantConfig, TenantSummary } from '@/lib/types'
import { CLAIM_TYPES } from '@/lib/types'
import { generateId } from '@/lib/utils'

export function GET() {
  const all = store.listTenants()
  const summaries: TenantSummary[] = all.map((history) => {
    const latest = history[history.length - 1]
    return {
      tenantId: latest.config.tenantId,
      name: latest.config.name,
      enabledClaimTypes: CLAIM_TYPES.filter((t) => latest.config.claimTypes[t].enabled),
      lastModified: latest.savedAt,
      version: latest.version,
    }
  })
  return NextResponse.json(summaries)
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<TenantConfig>

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const tenantId = body.tenantId?.trim() || generateId()

  if (store.has(tenantId)) {
    return NextResponse.json({ error: 'Tenant ID already exists' }, { status: 409 })
  }

  const config: TenantConfig = {
    ...body,
    tenantId,
  } as TenantConfig

  store.create({
    version: 1,
    config,
    savedAt: new Date().toISOString(),
    savedBy: 'admin',
  })

  return NextResponse.json(config, { status: 201 })
}

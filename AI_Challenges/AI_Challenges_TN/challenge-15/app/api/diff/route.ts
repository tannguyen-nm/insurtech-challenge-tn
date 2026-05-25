import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { diffConfigs } from '@/lib/diff'

export async function POST(req: Request) {
  const { tenantIdA, tenantIdB } = (await req.json()) as {
    tenantIdA: string
    tenantIdB: string
  }

  const a = store.getLatest(tenantIdA)
  const b = store.getLatest(tenantIdB)

  if (!a) return NextResponse.json({ error: `Tenant ${tenantIdA} not found` }, { status: 404 })
  if (!b) return NextResponse.json({ error: `Tenant ${tenantIdB} not found` }, { status: 404 })

  const entries = diffConfigs(a.config, b.config)
  return NextResponse.json({ tenantA: a.config.name, tenantB: b.config.name, entries })
}

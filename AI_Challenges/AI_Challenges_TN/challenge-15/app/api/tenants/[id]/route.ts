import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import type { TenantConfig } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const latest = store.getLatest(id)
  if (!latest) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  return NextResponse.json(latest)
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params
  const history = store.getHistory(id)
  if (!history) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body = (await req.json()) as TenantConfig
  const nextVersion = history[history.length - 1].version + 1

  const ok = store.appendVersion(id, {
    version: nextVersion,
    config: { ...body, tenantId: id },
    savedAt: new Date().toISOString(),
    savedBy: 'admin',
  })

  if (!ok) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  return NextResponse.json(store.getLatest(id))
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  if (!store.has(id)) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  store.delete(id)
  return NextResponse.json({ ok: true })
}

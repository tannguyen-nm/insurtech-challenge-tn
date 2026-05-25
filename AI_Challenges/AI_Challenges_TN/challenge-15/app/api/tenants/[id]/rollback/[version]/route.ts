import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

type Params = { params: Promise<{ id: string; version: string }> }

export async function PUT(_req: Request, { params }: Params) {
  const { id, version } = await params
  const history = store.getHistory(id)
  if (!history) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const targetVersion = parseInt(version, 10)
  const target = history.find((v) => v.version === targetVersion)
  if (!target) return NextResponse.json({ error: `Version ${version} not found` }, { status: 404 })

  const nextVersion = history[history.length - 1].version + 1
  store.appendVersion(id, {
    version: nextVersion,
    config: target.config,
    savedAt: new Date().toISOString(),
    savedBy: `rollback-from-v${targetVersion}`,
  })

  return NextResponse.json(store.getLatest(id))
}

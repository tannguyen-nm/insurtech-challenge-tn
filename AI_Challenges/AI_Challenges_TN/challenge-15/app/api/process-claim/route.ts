import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { processClaim } from '@/lib/processClaim'
import type { ProcessClaimInput } from '@/lib/types'

export async function POST(req: Request) {
  const input = (await req.json()) as ProcessClaimInput

  const latest = store.getLatest(input.tenantId)
  if (!latest) {
    return NextResponse.json({ error: `Tenant ${input.tenantId} not found` }, { status: 404 })
  }

  const result = processClaim(latest.config, input)
  return NextResponse.json(result)
}

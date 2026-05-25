import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const history = store.getHistory(id)
  if (!history) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  return NextResponse.json(history)
}

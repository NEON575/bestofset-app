import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ALLOWED: string[] = [
  'order', 'customer', 'payment', 'invoice', 'costItem',
  'inventoryItem', 'purchase', 'supplier', 'debt',
  'employee', 'salary',
]

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.AGENT_TOKEN || auth !== `Bearer ${process.env.AGENT_TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let payload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON parse xetasi' }, { status: 400 })
  }

  const { model, operation, where, data } = payload

  if (!ALLOWED.includes(model)) {
    return NextResponse.json(
      { error: `model icazeli deyil: ${model}. Icazelilar: ${ALLOWED.join(', ')}` },
      { status: 400 }
    )
  }
  if (!['create', 'update'].includes(operation)) {
    return NextResponse.json({ error: 'yalniz create ve update' }, { status: 400 })
  }
  if (operation === 'update' && !where?.id) {
    return NextResponse.json({ error: 'update ucun where.id lazimdir' }, { status: 400 })
  }

  try {
    const client = (prisma as any)[model]
    const result =
      operation === 'create'
        ? await client.create({ data })
        : await client.update({ where, data })

    console.log('[AGENT]', operation, model, JSON.stringify(result).slice(0, 300))
    return NextResponse.json({ ok: true, result })
  } catch (e: any) {
    console.error('[AGENT ERROR]', model, operation, e.message)
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

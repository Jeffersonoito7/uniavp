import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? '' })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Subscription inválida' }, { status: 400 })
  }

  const admin = createServiceRoleClient()
  await (admin.from('push_subscriptions') as any)
    .upsert(
      { user_id: user.id, endpoint, p256dh: keys.p256dh, auth_key: keys.auth },
      { onConflict: 'endpoint' }
    )

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { endpoint } = await req.json()
  const admin = createServiceRoleClient()
  await (admin.from('push_subscriptions') as any)
    .delete().eq('user_id', user.id).eq('endpoint', endpoint)

  return NextResponse.json({ ok: true })
}

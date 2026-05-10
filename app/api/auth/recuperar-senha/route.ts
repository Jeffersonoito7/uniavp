import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email, redirectTo } = await req.json()
  if (!email) return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })

  const adminClient = createServiceRoleClient()

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/redefinir-senha`,
    },
  })

  if (error || !data) {
    return NextResponse.json({ ok: true, link: null })
  }

  // Retorna o link para exibir na tela — e-mail do Supabase é instável
  return NextResponse.json({ ok: true, link: data.properties?.action_link ?? null })
}

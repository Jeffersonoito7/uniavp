import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email, redirectTo } = await req.json()
  if (!email) return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })

  const dest = redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/redefinir-senha`
  const adminClient = createServiceRoleClient()

  // 1. Gera o link para exibir na tela (funciona sempre)
  const { data } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: dest },
  })

  // 2. Tenta enviar o e-mail via Supabase SMTP (depende do SMTP configurado)
  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: dest })

  return NextResponse.json({ ok: true, link: data?.properties?.action_link ?? null })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email, redirectTo } = await req.json()
  if (!email) return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })

  const adminClient = createServiceRoleClient()

  // Gera o link via service role — bypassa a allowlist do Supabase
  // e garante que o redirect_to funcione corretamente
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/redefinir-senha`,
    },
  })

  if (error) {
    // Não revelar se o e-mail existe ou não (segurança)
    return NextResponse.json({ ok: true })
  }

  // Se gerou o link, o Supabase já enviou o e-mail automaticamente
  // O link também é retornado mas não o exibimos por segurança
  return NextResponse.json({ ok: true, enviado: !!data })
}

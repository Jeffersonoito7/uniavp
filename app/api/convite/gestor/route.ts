import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { getTenantId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { nome, email, whatsapp, senha } = await req.json()
  if (!nome || !email || !whatsapp || !senha) {
    return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 })
  }
  if (senha.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
  }

  const host = req.headers.get('host') ?? ''
  const tenantId = await getTenantId(host)

  const adminClient = createServiceRoleClient()

  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })
  if (authError || !authUser.user) {
    return NextResponse.json({ error: authError?.message ?? 'Erro ao criar conta.' }, { status: 400 })
  }

  const { error: gestorError } = await adminClient.from('gestores')
    .insert({
      user_id: authUser.user.id,
      nome,
      email,
      whatsapp: whatsapp.replace(/\D/g, ''),
      ativo: false,
      ...(tenantId ? { tenant_id: tenantId } : {}),
    })

  if (gestorError) {
    await adminClient.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json({ error: gestorError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

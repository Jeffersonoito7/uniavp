import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { codigo } = await req.json()
  if (!codigo) return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 })

  const adminClient = createServiceRoleClient()

  const { data: otp } = await (adminClient.from('verificacao_otp') as any)
    .select('id, codigo, expira_em, usado')
    .eq('user_id', user.id)
    .eq('usado', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!otp) return NextResponse.json({ error: 'Código inválido ou expirado.' }, { status: 400 })
  if (new Date(otp.expira_em) < new Date()) return NextResponse.json({ error: 'Código expirado. Solicite um novo.' }, { status: 400 })
  if (otp.codigo !== String(codigo).trim()) return NextResponse.json({ error: 'Código incorreto.' }, { status: 400 })

  await (adminClient.from('verificacao_otp') as any).update({ usado: true }).eq('id', otp.id)

  // Determina redirect pelo perfil do usuário (sem fetch externo)
  let redirect = '/'
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('whatsapp').eq('user_id', user.id).maybeSingle()
  if (aluno?.whatsapp) {
    redirect = `/aluno/${aluno.whatsapp}`
  } else {
    const { data: gestor } = await (adminClient.from('gestores') as any)
      .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
    if (gestor) redirect = '/gestor'
  }

  const response = NextResponse.json({ ok: true, redirect })

  response.cookies.set('otp_ok', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/'
  })

  return response
}

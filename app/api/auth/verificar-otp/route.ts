import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { rateLimit, LIMITS } from '@/lib/rate-limit'
import { captureException } from '@/lib/monitor'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const rl = await rateLimit(`verificar-otp:${user.id}`, LIMITS.otp)
  if (!rl.allowed) return NextResponse.json(
    { error: 'Muitas tentativas. Aguarde alguns minutos.' },
    { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
  )

  const { codigo } = await req.json()
  if (!codigo) return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 })

  const adminClient = createServiceRoleClient()

  const { data: otp } = await adminClient.from('verificacao_otp')
    .select('id, codigo, expira_em, usado')
    .eq('user_id', user.id)
    .eq('usado', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!otp) return NextResponse.json({ error: 'Código inválido ou expirado.' }, { status: 400 })
  if (new Date(otp.expira_em) < new Date()) return NextResponse.json({ error: 'Código expirado. Solicite um novo.' }, { status: 400 })
  if (otp.codigo !== String(codigo).trim()) return NextResponse.json({ error: 'Código incorreto.' }, { status: 400 })

  await adminClient.from('verificacao_otp').update({ usado: true }).eq('id', otp.id)

  // Determina redirect pelo perfil (mesma ordem do /api/auth/perfil)
  let redirect = '/'

  const { data: adminRec } = await adminClient.from('admins')
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (adminRec) {
    redirect = '/admin'
  } else {
    const { data: superRec } = await adminClient.from('super_admins')
      .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
    if (superRec) {
      redirect = '/super'
    } else {
      const { data: gestor } = await adminClient.from('gestores')
        .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
      if (gestor) {
        redirect = '/pro'
      } else {
        const { data: aluno } = await adminClient.from('alunos')
          .select('whatsapp').eq('user_id', user.id).maybeSingle()
        if (aluno?.whatsapp) redirect = `/aluno/${aluno.whatsapp}`
      }
    }
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
  } catch (e) {
    captureException(e, { endpoint: 'auth/verificar-otp' })
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}

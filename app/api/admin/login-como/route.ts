import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Verifica que é admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/entrar', req.url))

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.redirect(new URL('/entrar', req.url))

  const whatsapp = req.nextUrl.searchParams.get('whatsapp')
  if (!whatsapp) return NextResponse.json({ error: 'whatsapp obrigatório' }, { status: 400 })

  // Busca o aluno
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('email, whatsapp').eq('whatsapp', whatsapp).maybeSingle()
  if (!aluno) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })

  const host = (req.headers.get('host') || '').replace(/:\d+$/, '')
  const partes = host.split('.')
  const baseDomain = partes.length > 2 ? partes.slice(1).join('.') : host
  const appUrl = `https://uniavp.${baseDomain}`

  // Gera magic link para o aluno
  const { data: linkData, error } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: aluno.email,
    options: { redirectTo: `${appUrl}/aluno/${aluno.whatsapp}` },
  })

  if (error || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? 'Erro ao gerar link' }, { status: 500 })
  }

  // Define otp_ok para pular verificação OTP
  const res = NextResponse.redirect(linkData.properties.action_link)
  res.cookies.set('otp_ok', '1', {
    domain: `.${baseDomain}`,
    path: '/',
    maxAge: 60 * 60 * 8,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  })

  return res
}

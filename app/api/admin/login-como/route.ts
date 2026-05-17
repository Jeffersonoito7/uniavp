import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/entrar', req.url))

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.redirect(new URL('/entrar', req.url))

  const whatsapp = req.nextUrl.searchParams.get('whatsapp')
  const tipo = req.nextUrl.searchParams.get('tipo') ?? 'free' // 'free' | 'pro'
  if (!whatsapp) return NextResponse.json({ error: 'whatsapp obrigatório' }, { status: 400 })

  const host = (req.headers.get('host') || '').replace(/:\d+$/, '')
  const partes = host.split('.')
  const baseDomain = partes.length > 2 ? partes.slice(1).join('.') : host

  let email: string
  let redirectTo: string

  if (tipo === 'pro') {
    const { data: gestor } = await (adminClient.from('gestores') as any)
      .select('email, whatsapp').eq('whatsapp', whatsapp).maybeSingle()
    if (!gestor) return NextResponse.json({ error: 'PRO não encontrado' }, { status: 404 })
    email = gestor.email
    redirectTo = `https://gestor.${baseDomain}/gestor`
  } else {
    const { data: aluno } = await (adminClient.from('alunos') as any)
      .select('email, whatsapp').eq('whatsapp', whatsapp).maybeSingle()
    if (!aluno) return NextResponse.json({ error: 'FREE não encontrado' }, { status: 404 })
    email = aluno.email
    redirectTo = `https://uniavp.${baseDomain}/aluno/${whatsapp}`
  }

  const { data: linkData, error } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })

  if (error || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? 'Erro ao gerar link' }, { status: 500 })
  }

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

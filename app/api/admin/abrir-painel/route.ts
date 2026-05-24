import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/entrar?p=adm', req.url))

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await adminClient.from('admins')
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.redirect(new URL('/entrar?p=adm', req.url))

  const destino = req.nextUrl.searchParams.get('destino') || 'pro'
  const whatsapp = req.nextUrl.searchParams.get('whatsapp')

  const host = (req.headers.get('host') || '').replace(/:\d+$/, '')
  const partes = host.split('.')
  const baseDomain = partes.length > 2 ? partes.slice(1).join('.') : host

  let redirectUrl: string
  if (destino === 'pro') {
    redirectUrl = `https://uniavp.${baseDomain}/pro`
  } else if (destino === 'free' && whatsapp) {
    redirectUrl = `https://uniavp.${baseDomain}/aluno/${whatsapp}`
  } else {
    return NextResponse.json({ error: 'Destino inválido' }, { status: 400 })
  }

  const res = NextResponse.redirect(redirectUrl)
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

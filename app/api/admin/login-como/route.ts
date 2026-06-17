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

  const whatsapp = req.nextUrl.searchParams.get('whatsapp')
  const tipo = req.nextUrl.searchParams.get('tipo') ?? 'free'
  if (!whatsapp) return NextResponse.json({ error: 'whatsapp obrigatório' }, { status: 400 })

  const host = (req.headers.get('host') || '').replace(/:\d+$/, '')
  const partes = host.split('.')
  const baseDomain = partes.length > 2 ? partes.slice(1).join('.') : host

  let email: string
  let nome: string
  let destino: string

  if (tipo === 'pro') {
    const { data: gestor } = await adminClient.from('gestores')
      .select('email, nome').eq('whatsapp', whatsapp).maybeSingle()
    if (!gestor) return NextResponse.json({ error: 'PRO não encontrado' }, { status: 404 })
    email = gestor.email
    nome = gestor.nome
    destino = `https://uniavp.${baseDomain}/pro`
  } else {
    const { data: aluno } = await adminClient.from('alunos')
      .select('email, nome').eq('whatsapp', whatsapp).maybeSingle()
    if (!aluno) return NextResponse.json({ error: 'FREE não encontrado' }, { status: 404 })
    email = aluno.email
    nome = aluno.nome
    destino = `https://uniavp.${baseDomain}/aluno/${whatsapp}`
  }

  const { data: linkData, error } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: destino },
  })

  if (error || !linkData?.properties?.action_link) {
    return new NextResponse(`<html><body style="font-family:sans-serif;padding:40px;background:#0a0a0f;color:#fff">
      <h2>Erro ao gerar link</h2>
      <p style="color:#f87171">${error?.message ?? 'Erro desconhecido'}</p>
      <a href="javascript:history.back()" style="color:#6366f1">← Voltar</a>
    </body></html>`, { headers: { 'Content-Type': 'text/html' } })
  }

  const link = linkData.properties.action_link

  // Redireciona direto para o magic link — o auth do Supabase processa e cai no painel do aluno
  return NextResponse.redirect(link)
}

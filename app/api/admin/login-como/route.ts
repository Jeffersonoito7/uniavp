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

  // Tambem aceita super admin
  const { data: superRecord } = !adminRecord
    ? await adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
    : { data: null }

  if (!adminRecord && !superRecord) return NextResponse.redirect(new URL('/entrar?p=adm', req.url))

  const whatsapp = req.nextUrl.searchParams.get('whatsapp')
  const tipo = req.nextUrl.searchParams.get('tipo') ?? 'free'
  if (!whatsapp) return NextResponse.json({ error: 'whatsapp obrigatório' }, { status: 400 })

  let email: string
  let nome: string
  let paginaFinal: string
  let tenantId: string | null = null

  if (tipo === 'pro') {
    const { data: gestor } = await adminClient.from('gestores')
      .select('email, nome, tenant_id').eq('whatsapp', whatsapp).maybeSingle()
    if (!gestor) return NextResponse.json({ error: 'PRO não encontrado' }, { status: 404 })
    email = gestor.email
    nome = gestor.nome
    tenantId = gestor.tenant_id ?? null
    paginaFinal = '/pro'
  } else {
    const { data: aluno } = await adminClient.from('alunos')
      .select('email, nome, tenant_id').eq('whatsapp', whatsapp).maybeSingle()
    if (!aluno) return NextResponse.json({ error: 'FREE não encontrado' }, { status: 404 })
    email = aluno.email
    nome = aluno.nome
    tenantId = aluno.tenant_id ?? null
    paginaFinal = `/aluno/${whatsapp}`
  }

  // Tenta obter o dominio real do tenant no banco de dados
  let appBase = process.env.NEXT_PUBLIC_APP_URL ?? ''
  if (tenantId) {
    const { data: cliente } = await adminClient.from('clientes')
      .select('dominio').eq('id', tenantId).maybeSingle()
    if (cliente?.dominio) {
      appBase = `https://${cliente.dominio}`
    }
  }

  // Fallback: usa o host da requisicao (remove prefixo adm. se existir)
  if (!appBase) {
    const host = (req.headers.get('host') || '').replace(/:\d+$/, '')
    const baseDomain = host.startsWith('adm.') ? host.replace(/^adm\./, '') : host
    appBase = `https://${baseDomain}`
  }

  const redirectTo = `${appBase}/api/auth/callback?next=${encodeURIComponent(paginaFinal)}`
  const host = (req.headers.get('host') || '').replace(/:\d+$/, '')

  const { data: linkData, error } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })

  // debug só funciona em desenvolvimento local — nunca em produção
  const debug = process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('debug') === '1'

  if (error || !linkData?.properties?.action_link) {
    return new NextResponse(`<html><body style="font-family:sans-serif;padding:40px;background:#0a0a0f;color:#fff">
      <h2>Erro ao gerar link</h2>
      <p style="color:#f87171">${error?.message ?? 'Erro desconhecido'}</p>
      <p style="color:#94a3b8;font-size:13px">host: ${host} | tenantId: ${tenantId} | appBase: ${appBase}</p>
      <p style="color:#94a3b8;font-size:13px">redirectTo: ${redirectTo}</p>
      <a href="javascript:history.back()" style="color:#6366f1">Voltar</a>
    </body></html>`, { headers: { 'Content-Type': 'text/html' } })
  }

  const link = linkData.properties.action_link

  if (debug) {
    return new NextResponse(`<html><body style="font-family:monospace;padding:40px;background:#0a0a0f;color:#f1f5f9;font-size:13px">
      <h2 style="font-family:sans-serif">Debug: Entrar como ${nome}</h2>
      <p><b>host:</b> ${host}</p>
      <p><b>tenantId:</b> ${tenantId ?? 'nenhum'}</p>
      <p><b>appBase:</b> ${appBase}</p>
      <p><b>redirectTo:</b> <span style="color:#6ee7b7">${redirectTo}</span></p>
      <p><b>action_link:</b> <span style="color:#93c5fd;word-break:break-all">${link}</span></p>
      <br>
      <a href="${link}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-weight:700">Abrir magic link</a>
      &nbsp;
      <a href="javascript:history.back()" style="color:#6366f1;font-family:sans-serif">Voltar</a>
    </body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  return NextResponse.redirect(link)
}

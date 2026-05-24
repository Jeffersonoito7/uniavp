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

  return new NextResponse(`<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Entrar como ${nome}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="font-family:Inter,sans-serif;padding:40px 20px;background:#0a0a0f;color:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;box-sizing:border-box">
  <div style="max-width:520px;width:100%;text-align:center">
    <div style="font-size:48px;margin-bottom:16px">🔑</div>
    <h2 style="font-size:22px;font-weight:800;margin-bottom:8px">Entrar como ${nome}</h2>
    <p style="color:rgba(255,255,255,0.5);font-size:14px;margin-bottom:32px">
      Copie o link abaixo e abra em uma <strong style="color:#fff">aba anônima</strong> para acessar o painel como esse usuário.
    </p>
    <div style="background:#111827;border:1px solid #374151;border-radius:10px;padding:14px 16px;margin-bottom:16px;text-align:left;overflow:hidden">
      <p style="font-size:11px;word-break:break-all;color:#6ee7b7;font-family:monospace;margin:0">${link}</p>
    </div>
    <button onclick="navigator.clipboard.writeText('${link}').then(()=>this.textContent='✅ Copiado!')"
      style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;padding:14px 32px;font-weight:700;font-size:15px;cursor:pointer;width:100%;margin-bottom:12px">
      📋 Copiar link
    </button>
    <p style="font-size:12px;color:rgba(255,255,255,0.3)">O link expira em 1 hora e funciona uma única vez</p>
    <a href="javascript:history.back()" style="color:#6366f1;font-size:13px;text-decoration:none">← Voltar</a>
  </div>
</body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

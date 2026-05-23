import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { registrarDominiosTenant } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

// Onboarding automático de novo cliente:
// 1. Cria admin auth + registro
// 2. Adiciona domínio na Vercel
// 3. Adiciona DNS no Cloudflare
// 4. Envia credenciais por WhatsApp

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: sa } = await (adminClient.from('super_admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!sa) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { cliente_id, admin_email, admin_nome, admin_senha, dominio } = await req.json()
  if (!cliente_id || !admin_email || !admin_nome || !admin_senha)
    return NextResponse.json({ error: 'cliente_id, admin_email, admin_nome, admin_senha são obrigatórios' }, { status: 400 })

  const resultados: string[] = []

  // ── 1. Criar admin da empresa no Supabase auth ────────────────
  const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
    email: admin_email, password: admin_senha, email_confirm: true,
  })
  if (authErr) return NextResponse.json({ error: 'Erro ao criar auth: ' + authErr.message }, { status: 400 })
  resultados.push(`✅ Auth criado: ${admin_email}`)

  // ── 2. Inserir admin na tabela admins (vinculado ao tenant) ──────
  const { error: adminErr } = await (adminClient.from('admins') as any)
    .insert({ user_id: authUser.user!.id, nome: admin_nome, email: admin_email, ativo: true, role: 'admin', tenant_id: cliente_id })
  if (adminErr) { resultados.push(`⚠️ Admin DB: ${adminErr.message}`) }
  else resultados.push('✅ Admin registrado no banco')

  // ── 2b. Registrar domínios do tenant ─────────────────────────
  if (dominio) {
    const dominios = [
      dominio,
      `adm.${dominio}`,
      `free.${dominio}`,
      `pro.${dominio}`,
    ]
    await registrarDominiosTenant(cliente_id, dominios)
    resultados.push(`✅ Domínios registrados: ${dominios.join(', ')}`)
  }

  // ── 3. Configurar domínio na Vercel ───────────────────────────
  if (dominio && process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID) {
    const subdomains = [`free.${dominio}`, `pro.${dominio}`, `adm.${dominio}`]
    for (const sub of subdomains) {
      try {
        const res = await fetch(`https://api.vercel.com/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: sub }),
        })
        const data = await res.json()
        resultados.push(res.ok ? `✅ Vercel: ${sub}` : `⚠️ Vercel ${sub}: ${data.error?.message}`)
      } catch (e: any) { resultados.push(`⚠️ Vercel erro: ${e.message}`) }
    }
  } else {
    resultados.push('⏭️ Vercel: VERCEL_TOKEN não configurado — adicione manualmente')
  }

  // ── 4. Configurar DNS no Cloudflare ──────────────────────────
  if (dominio && process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID) {
    const registros = [
      { name: `free.${dominio.split('.').slice(1).join('.')}`, content: dominio },
      { name: `pro.${dominio.split('.').slice(1).join('.')}`, content: dominio },
      { name: `adm.${dominio.split('.').slice(1).join('.')}`, content: dominio },
    ]
    for (const r of registros) {
      try {
        const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'CNAME', name: r.name, content: r.content, proxied: true, ttl: 1 }),
        })
        const data = await res.json()
        resultados.push(data.success ? `✅ DNS: ${r.name}` : `⚠️ DNS ${r.name}: ${data.errors?.[0]?.message}`)
      } catch (e: any) { resultados.push(`⚠️ Cloudflare erro: ${e.message}`) }
    }
  } else {
    resultados.push('⏭️ Cloudflare: CLOUDFLARE_API_TOKEN não configurado — adicione manualmente')
  }

  // ── 5. Enviar credenciais por WhatsApp ───────────────────────
  const { data: cliente } = await (adminClient.from('clientes') as any)
    .select('contato_whatsapp, contato_nome, nome, observacoes').eq('id', cliente_id).maybeSingle()

  if (cliente?.contato_whatsapp) {
    const { enviarWhatsApp } = await import('@/lib/whatsapp')
    const appUrl = dominio ? `https://${dominio}` : process.env.NEXT_PUBLIC_APP_URL
    const linkFree = dominio ? `https://free.${dominio}/captacao` : `${appUrl}/captacao`
    const linkAdmin = dominio ? `https://adm.${dominio}/admin` : `${appUrl}/admin`

    // Detecta se é Painel Liderança
    let isLideranca = false
    try { isLideranca = JSON.parse(cliente.observacoes || '{}')._tipo === 'lideranca' } catch { /* */ }

    const nomeCliente = cliente.contato_nome || cliente.nome

    const msg = isLideranca
      ? `🏅 *Seu Painel Liderança está pronto, ${nomeCliente}!*\n\n` +
        `Agora você tem sua própria plataforma de treinamentos para gerenciar sua equipe.\n\n` +
        `🛡 *Seu painel admin:*\n${linkAdmin}\n` +
        `📧 Login: ${admin_email}\n` +
        `🔑 Senha: ${admin_senha}\n\n` +
        `🔗 *Link para seus membros se cadastrarem:*\n${linkFree}\n\n` +
        `_Configure sua logo, cores e crie seus primeiros módulos no painel admin._\n` +
        `_Recomendamos trocar a senha no primeiro acesso._`
      : `🎉 *Bem-vindo à plataforma, ${nomeCliente}!*\n\n` +
        `Sua plataforma está pronta para uso. Aqui estão seus acessos:\n\n` +
        `🛡 *Painel Admin (você):*\n${linkAdmin}\n` +
        `📧 Login: ${admin_email}\n` +
        `🔑 Senha: ${admin_senha}\n\n` +
        `🔗 *Link de cadastro para seus membros:*\n${linkFree}\n\n` +
        `_Acesse o painel Admin para configurar logo, cores e conteúdo._\n` +
        `_Recomendamos trocar a senha no primeiro acesso._`

    await enviarWhatsApp(cliente.contato_whatsapp, msg)
    resultados.push('✅ Credenciais enviadas por WhatsApp')
  }

  return NextResponse.json({ ok: true, resultados })
}

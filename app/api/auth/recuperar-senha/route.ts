import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const EVO_URL = process.env.EVOLUTION_API_URL
const EVO_KEY = process.env.EVOLUTION_API_KEY

async function buscarWhatsAppPorEmail(email: string, adminClient: ReturnType<typeof createServiceRoleClient>): Promise<{ whatsapp: string; instancia: string | null; tenantId: string | null } | null> {
  // Busca em alunos
  const { data: aluno } = await adminClient.from('alunos')
    .select('whatsapp, gestor_nome, tenant_id').eq('email', email).maybeSingle()
  if (aluno?.whatsapp) {
    // Tenta pegar instância do gestor do aluno (filtrado pelo tenant)
    let instancia: string | null = null
    if (aluno.gestor_nome) {
      let q = adminClient.from('gestores').select('whatsapp_instancia').eq('nome', aluno.gestor_nome).eq('ativo', true)
      if (aluno.tenant_id) q = q.eq('tenant_id', aluno.tenant_id)
      const { data: g } = await q.maybeSingle()
      instancia = g?.whatsapp_instancia ?? null
    }
    // Fallback: instância do admin do mesmo tenant
    if (!instancia) {
      let q = adminClient.from('admins').select('whatsapp_instancia').eq('ativo', true).not('whatsapp_instancia', 'is', null).limit(1)
      if (aluno.tenant_id) q = q.eq('tenant_id', aluno.tenant_id)
      const { data: adm } = await q.maybeSingle()
      instancia = adm?.whatsapp_instancia ?? null
    }
    return { whatsapp: aluno.whatsapp, instancia, tenantId: aluno.tenant_id ?? null }
  }

  // Busca em gestores
  const { data: gestor } = await adminClient.from('gestores')
    .select('whatsapp, whatsapp_instancia, tenant_id').eq('email', email).maybeSingle()
  if (gestor?.whatsapp) {
    const instancia = gestor.whatsapp_instancia ?? null
    return { whatsapp: gestor.whatsapp, instancia, tenantId: gestor.tenant_id ?? null }
  }

  // Busca em admins — usa instância do próprio admin
  const { data: admin } = await adminClient.from('admins')
    .select('whatsapp, whatsapp_instancia, tenant_id').eq('email', email).maybeSingle()
  if (admin?.whatsapp) {
    const instancia = admin.whatsapp_instancia ?? null
    return { whatsapp: admin.whatsapp, instancia, tenantId: admin.tenant_id ?? null }
  }

  return null
}

async function enviarLinkWhatsApp(whatsapp: string, link: string, instancia: string, siteNome: string) {
  if (!EVO_URL || !EVO_KEY) return false
  const texto = `🔐 *${siteNome} — Redefinição de senha*\n\nClique no link abaixo para criar uma nova senha:\n\n👉 ${link}\n\n⚠️ O link é válido por 1 hora e funciona apenas uma vez.\n\nSe não foi você que solicitou, ignore esta mensagem.`
  try {
    const res = await fetch(`${EVO_URL}/message/sendText/${instancia}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number: whatsapp.replace(/\D/g, ''), textMessage: { text: texto } }),
    })
    return res.ok
  } catch { return false }
}

export async function POST(req: NextRequest) {
  const { email, redirectTo } = await req.json()
  if (!email) return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })

  const host = req.headers.get('host') || ''
  const origin = `https://${host}`
  const dest = redirectTo || `${origin}/redefinir-senha`
  const adminClient = createServiceRoleClient()

  // Gera o link de recuperação (sempre funciona)
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: dest },
  })

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: 'E-mail não encontrado na plataforma.' }, { status: 404 })
  }

  const link = data.properties.action_link

  // Busca WhatsApp do usuário e envia o link
  const ctx = await buscarWhatsAppPorEmail(email, adminClient)
  let enviadoWpp = false

  if (ctx?.whatsapp && ctx?.instancia) {
    // Pega nome do site do tenant correto
    let siteNome = 'Plataforma'
    if (ctx.tenantId) {
      const { data: siteNomeCfg } = await adminClient.from('configuracoes')
        .select('valor').eq('chave', 'site_nome').eq('tenant_id', ctx.tenantId).maybeSingle()
      try { siteNome = JSON.parse(String(siteNomeCfg?.valor ?? '')) || siteNome } catch { /* */ }
    }

    enviadoWpp = await enviarLinkWhatsApp(ctx.whatsapp, link, ctx.instancia, siteNome)
  }

  return NextResponse.json({
    ok: true,
    link,
    enviadoWpp,
    whatsappMask: ctx?.whatsapp
      ? `*${ctx.whatsapp.slice(-4).padStart(ctx.whatsapp.length, '*')}`
      : null,
  })
}

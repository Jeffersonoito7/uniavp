import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const EVO_URL = process.env.EVOLUTION_API_URL
const EVO_KEY = process.env.EVOLUTION_API_KEY

async function buscarWhatsAppPorEmail(email: string, adminClient: ReturnType<typeof createServiceRoleClient>): Promise<{ whatsapp: string; instancia: string | null; tenantId: string | null } | null> {
  const { data: aluno } = await adminClient.from('alunos')
    .select('whatsapp, gestor_nome, tenant_id').eq('email', email).maybeSingle()
  if (aluno?.whatsapp) {
    let instancia: string | null = null
    if (aluno.gestor_nome) {
      let q = adminClient.from('gestores').select('whatsapp_instancia').eq('nome', aluno.gestor_nome).eq('ativo', true)
      if (aluno.tenant_id) q = q.eq('tenant_id', aluno.tenant_id)
      const { data: g } = await q.maybeSingle()
      instancia = g?.whatsapp_instancia ?? null
    }
    if (!instancia) {
      let q = adminClient.from('admins').select('whatsapp_instancia').eq('ativo', true).not('whatsapp_instancia', 'is', null).limit(1)
      if (aluno.tenant_id) q = q.eq('tenant_id', aluno.tenant_id)
      const { data: adm } = await q.maybeSingle()
      instancia = adm?.whatsapp_instancia ?? null
    }
    return { whatsapp: aluno.whatsapp, instancia, tenantId: aluno.tenant_id ?? null }
  }

  const { data: gestor } = await adminClient.from('gestores')
    .select('whatsapp, whatsapp_instancia, tenant_id').eq('email', email).maybeSingle()
  if (gestor?.whatsapp) {
    return { whatsapp: gestor.whatsapp, instancia: gestor.whatsapp_instancia ?? null, tenantId: gestor.tenant_id ?? null }
  }

  const { data: admin } = await adminClient.from('admins')
    .select('whatsapp, whatsapp_instancia, tenant_id').eq('email', email).maybeSingle()
  if (admin?.whatsapp) {
    return { whatsapp: admin.whatsapp, instancia: admin.whatsapp_instancia ?? null, tenantId: admin.tenant_id ?? null }
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

  // Gera o link (para WhatsApp e tela)
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: dest },
  })

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: 'E-mail não encontrado na plataforma.' }, { status: 404 })
  }

  const link = data.properties.action_link

  // Envia email via Supabase nativo (usa SMTP configurado no projeto Supabase)
  try {
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await anonClient.auth.resetPasswordForEmail(email, { redirectTo: dest })
  } catch { /* não bloqueia */ }

  // Busca contexto do usuário para WhatsApp
  const ctx = await buscarWhatsAppPorEmail(email, adminClient)
  let siteNome = 'Plataforma'
  let enviadoWpp = false

  if (ctx?.tenantId) {
    const { data: cfg } = await adminClient.from('configuracoes')
      .select('valor').eq('chave', 'site_nome').eq('tenant_id', ctx.tenantId).maybeSingle()
    try { siteNome = JSON.parse(String(cfg?.valor ?? '')) || siteNome } catch { /* */ }
  }

  if (ctx?.whatsapp && ctx?.instancia) {
    enviadoWpp = await enviarLinkWhatsApp(ctx.whatsapp, link, ctx.instancia, siteNome)
  }

  return NextResponse.json({
    ok: true,
    link,
    enviadoEmail: true,
    enviadoWpp,
    whatsappMask: ctx?.whatsapp
      ? `*${ctx.whatsapp.slice(-4).padStart(ctx.whatsapp.length, '*')}`
      : null,
  })
}

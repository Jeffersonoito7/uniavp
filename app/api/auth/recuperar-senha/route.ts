import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { Resend } from 'resend'
import { EMAIL_FROM } from '@/lib/constants'

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

async function enviarLinkEmail(email: string, link: string, siteNome: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `${siteNome} — Redefinição de senha`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff">
          <h2 style="color:#111;margin-bottom:8px">Redefinição de senha</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;margin-bottom:24px">
            Recebemos uma solicitação para redefinir a senha da sua conta em <strong>${siteNome}</strong>.
            Clique no botão abaixo para criar uma nova senha:
          </p>
          <a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px">
            Redefinir minha senha
          </a>
          <p style="color:#888;font-size:13px;margin-top:24px;line-height:1.6">
            O link é válido por <strong>1 hora</strong> e funciona apenas uma vez.<br>
            Se não foi você que solicitou, ignore este e-mail.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
          <p style="color:#aaa;font-size:12px">${siteNome}</p>
        </div>
      `,
    })
    return !error
  } catch { return false }
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

  // Busca nome do site (antes do WhatsApp para reaproveitar no email)
  const ctx = await buscarWhatsAppPorEmail(email, adminClient)
  let siteNomeGlobal = 'Plataforma'

  // Envia por email (Resend) — canal principal
  let siteNomeTmp = siteNomeGlobal
  if (ctx?.tenantId) {
    const { data: siteNomeCfg } = await adminClient.from('configuracoes')
      .select('valor').eq('chave', 'site_nome').eq('tenant_id', ctx.tenantId).maybeSingle()
    try { siteNomeTmp = JSON.parse(String(siteNomeCfg?.valor ?? '')) || siteNomeTmp } catch { /* */ }
  }
  siteNomeGlobal = siteNomeTmp
  const enviadoEmail = await enviarLinkEmail(email, link, siteNomeGlobal)

  // Busca WhatsApp do usuário e envia o link
  let enviadoWpp = false

  if (ctx?.whatsapp && ctx?.instancia) {
    enviadoWpp = await enviarLinkWhatsApp(ctx.whatsapp, link, ctx.instancia, siteNomeGlobal)
  }

  return NextResponse.json({
    ok: true,
    link,
    enviadoEmail,
    enviadoWpp,
    whatsappMask: ctx?.whatsapp
      ? `*${ctx.whatsapp.slice(-4).padStart(ctx.whatsapp.length, '*')}`
      : null,
  })
}

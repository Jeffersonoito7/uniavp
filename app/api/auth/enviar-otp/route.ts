import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const EVO_URL = process.env.EVOLUTION_API_URL
const EVO_KEY = process.env.EVOLUTION_API_KEY

function gerarCodigo(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function buscarInstanciaAdmin(adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await (adminClient.from('admins') as any)
    .select('whatsapp_instancia').eq('ativo', true).not('whatsapp_instancia', 'is', null).limit(1).maybeSingle()
  return data?.whatsapp_instancia ?? null
}

async function enviarWhatsApp(numero: string, codigo: string, instancia: string): Promise<boolean> {
  if (!EVO_URL || !EVO_KEY) return false
  try {
    const res = await fetch(`${EVO_URL}/message/sendText/${instancia}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({
        number: numero.replace(/\D/g, ''),
        textMessage: {
          text: `🔐 *Código de verificação*\n\nSeu código é: *${codigo}*\n\nVálido por 10 minutos. Não compartilhe com ninguém.`
        }
      })
    })
    return res.ok
  } catch { return false }
}

async function enviarEmail(email: string, codigo: string): Promise<boolean> {
  const RESEND_KEY = process.env.RESEND_API_KEY
  if (!RESEND_KEY) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@uniavp.com.br',
        to: email,
        subject: '🔐 Código de verificação',
        html: `<div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px">
          <h2 style="margin:0 0 8px">Código de verificação</h2>
          <p style="color:#666;margin:0 0 24px">Use este código para acessar sua conta:</p>
          <div style="background:#f4f4f4;border-radius:8px;padding:24px;text-align:center;font-size:36px;font-weight:900;letter-spacing:8px;color:#1a1a1a">${codigo}</div>
          <p style="color:#999;font-size:13px;margin:16px 0 0">Válido por 10 minutos. Não compartilhe.</p>
        </div>`
      })
    })
    return res.ok
  } catch { return false }
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()

  // Busca whatsapp do usuário (aluno ou gestor)
  let whatsapp: string | null = null
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('whatsapp').eq('user_id', user.id).maybeSingle()
  if (aluno?.whatsapp) whatsapp = aluno.whatsapp

  if (!whatsapp) {
    const { data: gestor } = await (adminClient.from('gestores') as any)
      .select('whatsapp').eq('user_id', user.id).maybeSingle()
    if (gestor?.whatsapp) whatsapp = gestor.whatsapp
  }

  // Invalida OTPs anteriores
  await (adminClient.from('verificacao_otp') as any)
    .update({ usado: true })
    .eq('user_id', user.id)
    .eq('usado', false)

  const codigo = gerarCodigo()
  const expira_em = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  let canal = 'email'
  let enviado = false

  // Tenta WhatsApp primeiro
  if (whatsapp) {
    const instancia = await buscarInstanciaAdmin(adminClient)
    if (instancia) {
      enviado = await enviarWhatsApp(whatsapp, codigo, instancia)
      if (enviado) canal = 'whatsapp'
    }
  }

  // Fallback email
  if (!enviado && user.email) {
    enviado = await enviarEmail(user.email, codigo)
    if (enviado) canal = 'email'
  }

  // Salva OTP no banco (sempre, mesmo se envio falhou — para dev)
  await (adminClient.from('verificacao_otp') as any)
    .insert({ user_id: user.id, codigo, expira_em, canal })

  const destino = canal === 'whatsapp'
    ? `WhatsApp *${whatsapp?.slice(-4).padStart(whatsapp?.length ?? 4, '*')}`
    : `e-mail ${user.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`

  return NextResponse.json({
    ok: true,
    canal,
    destino,
    // Mostra código na tela quando nenhum canal de envio está configurado
    ...(!enviado ? { codigoDev: codigo } : {})
  })
}

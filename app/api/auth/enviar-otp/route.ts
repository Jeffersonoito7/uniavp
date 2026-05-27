import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { Resend } from 'resend'
import { EMAIL_FROM } from '@/lib/constants'
import { rateLimit, LIMITS } from '@/lib/rate-limit'
import { getIp } from '@/lib/audit'
import { createLogger } from '@/lib/logger'

const log = createLogger('enviar-otp')

export const dynamic = 'force-dynamic'

function gerarCodigo(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function mascaraEmail(email: string): string {
  const [local, domain] = email.split('@')
  const visible = local.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`
}

export async function POST(req: NextRequest) {
  try {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const rl = await rateLimit(`otp:${user.id}`, LIMITS.otp)
  if (!rl.allowed) return NextResponse.json(
    { error: 'Muitas tentativas. Aguarde alguns minutos.' },
    { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
  )

  const adminClient = createServiceRoleClient()

  // Invalida OTPs anteriores
  await adminClient.from('verificacao_otp')
    .update({ usado: true })
    .eq('user_id', user.id)
    .eq('usado', false)

  const codigo = gerarCodigo()
  const expira_em = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  let enviado = false
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

  if (resend) {
    try {
      await Promise.race([
        resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: `${codigo} — seu código de acesso`,
        html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr><td style="background:#02A153;padding:28px 40px;text-align:center">
          <p style="margin:0;font-size:20px;font-weight:900;color:#fff;letter-spacing:2px">Verificação de acesso</p>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="font-size:15px;color:#555;margin:0 0 32px;line-height:1.6;text-align:center">
            Use o código abaixo para acessar sua conta.<br>
            <strong>Válido por 10 minutos.</strong>
          </p>
          <table width="100%"><tr><td align="center" style="padding:20px 0">
            <div style="background:#f0fdf4;border:2px solid #02A153;border-radius:14px;padding:20px 40px;display:inline-block">
              <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:12px;color:#02A153;font-family:monospace">${codigo}</p>
            </div>
          </td></tr></table>
          <p style="font-size:13px;color:#9ca3af;text-align:center;margin:28px 0 0;line-height:1.6">
            Se você não tentou acessar, ignore este e-mail.<br>
            Nunca compartilhe este código com ninguém.
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #f0f0f0">
          <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center">
            Este é um e-mail automático. Não responda.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ])
      enviado = true
    } catch (e) {
      log.error('falha ao enviar email OTP', { err: String(e) })
    }
  }

  await adminClient.from('verificacao_otp')
    .insert({ user_id: user.id, codigo, expira_em, canal: 'email' })

  return NextResponse.json({
    ok: true,
    canal: 'email',
    destino: mascaraEmail(user.email),
    ...(!enviado ? { codigoDev: codigo } : {}),
  })
  } catch (e) {
    log.error('erro inesperado em enviar-otp', { err: String(e) })
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}

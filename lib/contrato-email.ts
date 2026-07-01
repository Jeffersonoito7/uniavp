import { Resend } from 'resend'
import { EMAIL_FROM } from '@/lib/constants'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function enviarCopiaContrato({
  email,
  nomeDestinatario,
  tituloContrato,
  numeroRegistro,
  corpoHtml,
  appUrl,
  contratoId,
}: {
  email: string
  nomeDestinatario: string
  tituloContrato: string
  numeroRegistro: string
  corpoHtml: string
  appUrl: string
  contratoId: string
}): Promise<void> {
  if (!resend) return

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,sans-serif;">
  <div style="max-width:680px;margin:0 auto;padding:32px 16px;">

    <div style="background:#1e293b;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;letter-spacing:1px;text-transform:uppercase;">Documento Assinado</p>
      <p style="color:#fff;font-size:20px;font-weight:800;margin:0;">${tituloContrato}</p>
      <p style="color:#64748b;font-size:12px;font-family:monospace;margin:8px 0 0;">N. ${numeroRegistro}</p>
    </div>

    <div style="background:#fff;padding:28px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">
        Ola, <strong>${nomeDestinatario}</strong>!<br><br>
        Segue abaixo a copia do contrato <strong>${tituloContrato}</strong>, agora com todas as assinaturas registradas.
      </p>

      <div style="background:#f1f5f9;border-radius:10px;padding:24px 28px;margin-bottom:24px;font-size:14px;line-height:1.8;color:#1e293b;">
        ${corpoHtml}
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
        <p style="color:#166534;font-size:13px;margin:0;font-weight:600;">Documento com validade juridica</p>
        <p style="color:#15803d;font-size:12px;margin:4px 0 0;">Assinado digitalmente conforme a Lei 14.063/2020 e o Marco Civil da Internet (Lei 12.965/2014). IP, data, hora e hash do documento foram registrados.</p>
      </div>

      <p style="font-size:13px;color:#6b7280;margin:0;">
        Voce tambem pode acessar este contrato em: <a href="${appUrl}/contrato/assinar/${contratoId}" style="color:#3b82f6;">${appUrl}/contrato/assinar/${contratoId}</a>
      </p>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Este e-mail foi enviado automaticamente. Nao responda.</p>
    </div>

  </div>
</body>
</html>`

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Copia do contrato: ${tituloContrato} — N. ${numeroRegistro}`,
    html,
  }).catch(() => {})
}

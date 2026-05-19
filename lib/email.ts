import { Resend } from 'resend'

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}
const FROM = process.env.EMAIL_FROM || 'CNCPV <noreply@cncpv.com.br>'

export async function enviarEmailCNCPV(opts: {
  para: string
  nome: string
  numero_registro: string
  hash_contrato: string
  assinado_em: string
  appUrl: string
  pdfBytes?: Uint8Array
}): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const { para, nome, numero_registro, hash_contrato, assinado_em, appUrl, pdfBytes } = opts
  const verUrl = `${appUrl}/cncpv/verificar/${numero_registro}`
  const dataHora = new Date(assinado_em).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  try {
    const attachments = pdfBytes ? [{
      filename: `Contrato_CNCPV_${numero_registro}.pdf`,
      content: Buffer.from(pdfBytes).toString('base64'),
    }] : []

    await resend.emails.send({
      from: FROM,
      to: para,
      subject: `✅ Sua CNCPV foi emitida — ${numero_registro}`,
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr><td style="background:#02A153;padding:28px 40px">
          <table width="100%"><tr>
            <td><p style="margin:0;font-size:28px;font-weight:900;color:#fff;letter-spacing:3px">CNCPV</p>
            <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.75);letter-spacing:1px">CARTEIRA NACIONAL DO CONSULTOR DE PROTEÇÃO VEICULAR</p></td>
            <td align="right"><p style="margin:0;font-size:14px;font-weight:800;color:#fff;background:rgba(255,255,255,0.15);border-radius:8px;padding:6px 14px">${numero_registro}</p></td>
          </tr></table>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px">
          <p style="font-size:22px;font-weight:800;color:#1a1a1a;margin:0 0 8px">Olá, ${nome.split(' ')[0]}! 🎉</p>
          <p style="font-size:15px;color:#555;margin:0 0 28px;line-height:1.6">Seu contrato CNCPV foi <strong style="color:#02A153">assinado digitalmente</strong> e sua carteira profissional está emitida.</p>

          <!-- Info box -->
          <table width="100%" style="background:#f8fffe;border:1px solid #d1fae5;border-radius:12px;margin-bottom:28px">
            <tr><td style="padding:20px 24px">
              ${[
                ['Nº de Registro', numero_registro],
                ['Data/Hora', dataHora + ' (Brasília)'],
                ['E-mail', para],
              ].map(([l, v]) => `
              <table width="100%" style="margin-bottom:12px"><tr>
                <td style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px">${l}</td>
              </tr><tr>
                <td style="font-size:14px;font-weight:700;color:#1a1a1a">${v}</td>
              </tr></table>`).join('')}
            </td></tr>
          </table>

          <!-- Hash -->
          <table width="100%" style="background:#0f172a;border-radius:10px;margin-bottom:28px">
            <tr><td style="padding:16px 20px">
              <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#c8a535;text-transform:uppercase;letter-spacing:1px">🔐 Código de Autenticidade SHA-256</p>
              <p style="margin:0;font-size:11px;font-family:monospace;color:#94a3b8;word-break:break-all;line-height:1.6">${hash_contrato}</p>
            </td></tr>
          </table>

          <!-- CTA -->
          <table width="100%"><tr><td align="center">
            <a href="${verUrl}" style="display:inline-block;background:#02A153;color:#fff;text-decoration:none;border-radius:10px;padding:14px 36px;font-weight:800;font-size:15px">
              ✅ Verificar Autenticidade
            </a>
          </td></tr></table>

          <p style="font-size:13px;color:#9ca3af;text-align:center;margin:20px 0 0">
            ${pdfBytes ? 'O contrato completo está em anexo neste e-mail.' : ''}
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#02A153;padding:16px 40px">
          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.7);text-align:center">
            Validade jurídica: MP 2.200-2/2001 · Art. 107 do Código Civil · Lei 14.063/2020<br>
            ${verUrl}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      attachments,
    })
    return true
  } catch (e) {
    console.error('Erro ao enviar email CNCPV:', e)
    return false
  }
}

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const EMAIL_FROM = process.env.EMAIL_FROM || 'Universidade <noreply@oito7digital.com.br>'

// ── Envia link de assinatura de contrato por e-mail ──────────────────────────
export async function enviarEmailContrato({
  nome,
  email,
  token,
  tituloContrato,
  appUrl,
  contratadoPreenche = false,
  siteNome = 'Plataforma',
}: {
  nome: string
  email: string
  token: string
  tituloContrato: string
  appUrl: string
  contratadoPreenche?: boolean
  siteNome?: string
}): Promise<boolean> {
  const link = `${appUrl}/contrato/assinar/${token}`
  const instrucao = contratadoPreenche
    ? 'Ao abrir o link, preencha seus dados e assine digitalmente.'
    : 'Clique no botão abaixo para ler e assinar digitalmente.'

  const html = templateBase({
    siteNome,
    titulo: 'Contrato pendente de assinatura',
    corpo: `
      <p style="margin:0 0 16px">Olá, <strong>${escapeHtml(nome)}</strong>!</p>
      <p style="margin:0 0 24px">Você recebeu um contrato para assinar:<br>
        <strong>${escapeHtml(tituloContrato)}</strong>
      </p>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px">${instrucao}</p>
    `,
    botaoTexto: 'Assinar Contrato',
    botaoLink: link,
    rodape: 'O link de assinatura expira em 30 dias.',
  })

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Contrato para assinar: ${tituloContrato}`,
      html,
    })
    return !error
  } catch {
    return false
  }
}

// ── Envia link de redefinição de senha por e-mail ─────────────────────────────
export async function enviarEmailRecuperacaoSenha({
  email,
  link,
  siteNome = 'Plataforma',
}: {
  email: string
  link: string
  siteNome?: string
}): Promise<boolean> {
  const html = templateBase({
    siteNome,
    titulo: 'Redefinição de senha',
    corpo: `
      <p style="margin:0 0 16px">Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p style="margin:0 0 24px">Clique no botão abaixo para criar uma nova senha:</p>
    `,
    botaoTexto: 'Redefinir Senha',
    botaoLink: link,
    rodape: 'O link é válido por 1 hora e funciona apenas uma vez. Se não foi você, ignore este e-mail.',
  })

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `${siteNome} — Redefinição de senha`,
      html,
    })
    return !error
  } catch {
    return false
  }
}

// ── Template HTML base ────────────────────────────────────────────────────────
function templateBase({
  siteNome,
  titulo,
  corpo,
  botaoTexto,
  botaoLink,
  rodape,
}: {
  siteNome: string
  titulo: string
  corpo: string
  botaoTexto: string
  botaoLink: string
  rodape: string
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)">
        <!-- Cabeçalho -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f 0%,#0d9488 100%);padding:32px 40px;text-align:center">
            <p style="margin:0;color:#fff;font-size:18px;font-weight:700">${escapeHtml(siteNome)}</p>
          </td>
        </tr>
        <!-- Corpo -->
        <tr>
          <td style="padding:36px 40px">
            <h1 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#0f172a">${escapeHtml(titulo)}</h1>
            <div style="font-size:15px;line-height:1.6;color:#334155">
              ${corpo}
            </div>
            <!-- Botão -->
            <table cellpadding="0" cellspacing="0" style="margin:8px 0 32px">
              <tr>
                <td style="background:#1e3a5f;border-radius:8px">
                  <a href="${botaoLink}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:600;text-decoration:none">${escapeHtml(botaoTexto)}</a>
                </td>
              </tr>
            </table>
            <!-- Link alternativo -->
            <p style="margin:0;font-size:12px;color:#94a3b8">Ou copie o link abaixo:</p>
            <p style="margin:6px 0 0;font-size:12px;color:#64748b;word-break:break-all">${botaoLink}</p>
          </td>
        </tr>
        <!-- Rodapé -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;font-size:12px;color:#94a3b8">${escapeHtml(rodape)}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

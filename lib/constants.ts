// Domínio principal da plataforma master (Oito7 Digital).
// Para trocar, defina DOMINIO_MASTER no .env — não edite este arquivo.
export const DOMINIO_MASTER =
  process.env.DOMINIO_MASTER ?? 'universidade.oito7digital.com.br'

// Email padrão para envio transacional (Resend, notificações de cron, VAPID).
// Defina EMAIL_FROM no .env para customizar sem tocar no código.
export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? 'Universidade <noreply@autovaleprevencoes.org.br>'

// Assunto VAPID para Web Push (deve ser mailto: ou URL).
export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ?? 'noreply@oito7digital.com.br'

// Senha das contas de demonstração criadas por seed-demo.
// Use DEMO_PASSWORD no .env para trocar sem recompilação.
export const DEMO_PASSWORD =
  process.env.DEMO_PASSWORD ?? 'Demo@2025'

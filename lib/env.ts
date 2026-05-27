/**
 * Valida variáveis de ambiente obrigatórias na inicialização.
 * Chamado em instrumentation.ts — falha rápido antes de aceitar tráfego.
 */

type EnvVar = {
  key: string
  description: string
  optional?: boolean
}

const REQUIRED: EnvVar[] = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL',     description: 'URL pública do projeto Supabase' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',description: 'Chave anon do Supabase' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY',    description: 'Service role key do Supabase' },
  { key: 'CRON_SECRET',                  description: 'Secret compartilhado para autenticar crons' },
  { key: 'EFI_CLIENT_ID',               description: 'Client ID da Efí Bank (PIX)' },
  { key: 'EFI_CLIENT_SECRET',           description: 'Client Secret da Efí Bank (PIX)' },
  { key: 'EVOLUTION_API_URL',           description: 'URL da Evolution API (WhatsApp)' },
  { key: 'EVOLUTION_API_KEY',           description: 'API Key da Evolution API' },
  // Opcionais — degradam graciosamente se ausentes
  { key: 'RESEND_API_KEY',              description: 'API Key do Resend (e-mail)', optional: true },
  { key: 'ANTHROPIC_API_KEY',           description: 'API Key da Anthropic (IA)', optional: true },
  { key: 'DISCORD_WEBHOOK_URL',         description: 'Webhook do Discord para alertas', optional: true },
  { key: 'NEXT_PUBLIC_SENTRY_DSN',      description: 'DSN do Sentry para monitoramento', optional: true },
]

export function validateEnv(): void {
  const missing: string[] = []

  for (const v of REQUIRED) {
    if (!v.optional && !process.env[v.key]) {
      missing.push(`  - ${v.key}: ${v.description}`)
    }
  }

  if (missing.length > 0) {
    const msg = [
      '╔══════════════════════════════════════════════════════════╗',
      '║         VARIÁVEIS DE AMBIENTE OBRIGATÓRIAS AUSENTES      ║',
      '╚══════════════════════════════════════════════════════════╝',
      '',
      'As seguintes variáveis não estão configuradas:',
      ...missing,
      '',
      'Configure no arquivo .env.local (desenvolvimento) ou nas',
      'variáveis de ambiente do Vercel (produção) e reinicie.',
    ].join('\n')

    throw new Error(msg)
  }
}

import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { createHash, randomUUID } from 'crypto'

// ── Renderiza variaveis no template ────────────────────────────────────────
export function renderizarTemplate(corpo: string, variaveis: Record<string, string>): string {
  return corpo.replace(/\{\{(\w+)\}\}/g, (_, chave) => variaveis[chave] ?? `{{${chave}}}`)
}

// ── Gera numero de registro sequencial via sequence atomica do Postgres ────
export async function gerarNumeroContrato(
  adminClient: ReturnType<typeof createServiceRoleClient>,
  _tenantId: string | null
): Promise<string> {
  const { data, error } = await adminClient.rpc('gerar_numero_contrato')
  if (error || !data) throw new Error(`Falha ao gerar numero de contrato: ${error?.message}`)
  return data as string
}

// ── Calcula hash SHA-256 do contrato finalizado ────────────────────────────
export function calcularHash(conteudo: string): string {
  return createHash('sha256').update(conteudo).digest('hex')
}

// ── Calcula hash final incluindo dados de todos os assinantes ──────────────
export function calcularHashFinal(
  corpo: string,
  assinantes: Array<{
    ip_assinatura?: string | null
    assinatura_url?: string | null
    assinado_em?: string | null
    nome?: string | null
  }>
): string {
  const partes = [
    corpo,
    ...assinantes.map(a =>
      [a.nome ?? '', a.ip_assinatura ?? '', a.assinatura_url ?? '', a.assinado_em ?? ''].join('|')
    ),
  ]
  return createHash('sha256').update(partes.join('\n')).digest('hex')
}

// ── Gera token de acesso para assinante ───────────────────────────────────
export function gerarTokenAssinante(): { token: string; expira: Date } {
  const token = randomUUID().replace(/-/g, '')
  const expira = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
  return { token, expira }
}

// ── Envia link de assinatura via WhatsApp ─────────────────────────────────
export async function enviarLinkAssinatura({
  nome,
  whatsapp,
  token,
  tituloContrato,
  instancia,
  appUrl,
}: {
  adminClient: ReturnType<typeof createServiceRoleClient>
  nome: string
  whatsapp: string
  token: string
  tituloContrato: string
  instancia: string
  appUrl: string
}): Promise<void> {
  const link = `${appUrl}/contrato/assinar/${token}`
  const mensagem = `Ola, ${nome}!\n\nVoce tem um contrato pendente de assinatura:\n*${tituloContrato}*\n\nClique no link abaixo para ler e assinar:\n${link}\n\nO link expira em 30 dias.`
  await enviarWhatsApp(whatsapp, mensagem, instancia).catch(() => {})
}

// ── Envia link de assinatura via e-mail ───────────────────────────────────
export async function enviarLinkAssinaturaEmail({
  nome,
  email,
  token,
  tituloContrato,
  appUrl,
}: {
  nome: string
  email: string
  token: string
  tituloContrato: string
  appUrl: string
}): Promise<void> {
  const link = `${appUrl}/contrato/assinar/${token}`
  console.log(`[contrato-digital] Link para ${email}: ${link}`)
}

// ── Atualiza status do contrato com base nos assinantes ───────────────────
export async function atualizarStatusContrato(
  adminClient: ReturnType<typeof createServiceRoleClient>,
  contratoId: string
): Promise<void> {
  const { data: assinantes } = await adminClient
    .from('contrato_assinantes')
    .select('status, papel, ip_assinatura, assinatura_url, assinado_em, nome')
    .eq('contrato_id', contratoId)

  if (!assinantes || assinantes.length === 0) return

  // Fix 4: todos os assinantes (incluindo papel 'avp') devem ter assinado
  const pendentes = assinantes.filter(a => a.status !== 'assinado')
  const algumAssinado = assinantes.some(a => a.status === 'assinado')

  let novoStatus: 'enviado' | 'parcialmente_assinado' | 'concluido'
  if (pendentes.length === 0) {
    novoStatus = 'concluido'
  } else if (algumAssinado) {
    novoStatus = 'parcialmente_assinado'
  } else {
    novoStatus = 'enviado'
  }

  if (novoStatus === 'concluido') {
    const { data: contrato } = await adminClient
      .from('contratos_digitais')
      .select('corpo_renderizado, numero_registro')
      .eq('id', contratoId)
      .maybeSingle()

    // Fix 1: hash inclui corpo + dados individuais de cada assinante
    const hash = calcularHashFinal(
      contrato?.corpo_renderizado ?? '',
      assinantes.map(a => ({
        nome: a.nome,
        ip_assinatura: a.ip_assinatura,
        assinatura_url: a.assinatura_url,
        assinado_em: a.assinado_em,
      }))
    )

    await adminClient
      .from('contratos_digitais')
      .update({ status: novoStatus, hash_final: hash })
      .eq('id', contratoId)
  } else {
    await adminClient
      .from('contratos_digitais')
      .update({ status: novoStatus })
      .eq('id', contratoId)
  }
}

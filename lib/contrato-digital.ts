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
    .select('status, papel')
    .eq('contrato_id', contratoId)

  if (!assinantes || assinantes.length === 0) return

  const pendentes = assinantes.filter(a => a.papel !== 'avp' && a.status !== 'assinado')
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

    const conteudoFinal = JSON.stringify({
      numero: contrato?.numero_registro,
      corpo: contrato?.corpo_renderizado,
      assinantes: assinantes.map(a => ({ papel: a.papel, status: a.status })),
      concluido_em: new Date().toISOString(),
    })
    const hash = calcularHash(conteudoFinal)

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

/**
 * Sistema de templates de mensagem WhatsApp por tenant.
 * Cada mensagem tem uma chave unica. O admin pode personalizar por tenant
 * no banco (tabela mensagens_template). Sem override, usa o texto padrao abaixo.
 */

import { createServiceRoleClient } from '@/lib/supabase-server'

export type MensagemVars = Record<string, string | number | null | undefined>

// ── Cache em memória (5 min TTL) para evitar N queries por cron ────────────
type CacheEntry = { templates: Map<string, string>; ts: number }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60_000

async function getTemplates(
  adminClient: ReturnType<typeof createServiceRoleClient>,
  tenantId: string | null
): Promise<Map<string, string>> {
  const key = tenantId ?? '__global__'
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.templates

  let q = adminClient.from('mensagens_template').select('chave, texto')
  if (tenantId) {
    q = q.or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
  } else {
    q = q.is('tenant_id', null)
  }
  const { data } = await q.order('tenant_id', { ascending: true, nullsFirst: true })

  const templates = new Map<string, string>()
  for (const row of data ?? []) {
    // global (null) primeiro, tenant-specific depois — tenant sobrepõe global
    if (row.chave && row.texto) templates.set(row.chave, row.texto)
  }
  cache.set(key, { templates, ts: Date.now() })
  return templates
}

function substituir(texto: string, vars: MensagemVars): string {
  return texto.replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key]
    return val != null ? String(val) : `{${key}}`
  })
}

export async function getMensagem(
  chave: string,
  vars: MensagemVars,
  adminClient: ReturnType<typeof createServiceRoleClient>,
  tenantId?: string | null
): Promise<string> {
  try {
    const templates = await getTemplates(adminClient, tenantId ?? null)
    const template = templates.get(chave) ?? MENSAGENS_PADRAO[chave]
    if (!template) return substituir(MENSAGENS_PADRAO[chave] ?? chave, vars)
    return substituir(template, vars)
  } catch {
    return substituir(MENSAGENS_PADRAO[chave] ?? chave, vars)
  }
}

// ── Textos padrão ──────────────────────────────────────────────────────────
export const MENSAGENS_PADRAO: Record<string, string> = {
  // ── Cadastro ──────────────────────────────────────────────────────────────
  cadastro_gestor_novo_free:
    `🆓 *Novo FREE cadastrado!*\n\nOlá *{gestorNome}*! *{alunoNome}* acabou de se cadastrar em *{nomePlataforma}* pelo seu link. 🚀\n\n💬 Clique para chamar no WhatsApp:\n👉 {wppLink}\n\nVocê receberá atualizações do progresso dele por aqui.`,

  cadastro_indicador_novo_free:
    `🎉 *Sua indicação deu certo!*\n\n*{alunoNome}* se cadastrou em *{nomePlataforma}* pelo seu link! 🚀\n\n💬 Clique para chamar no WhatsApp:\n👉 {wppLink}\n\n_Aproveite para dar as boas-vindas e acompanhar o progresso dele!_`,

  cadastro_boas_vindas:
    `🎓 *Bem-vindo ao {nomePlataforma}, {alunoNome}!* 🚀\n\nSeu cadastro foi confirmado! Acesse a plataforma:\n👉 {appUrl}/entrar\n\n_Bons estudos!_`,

  cadastro_boas_vindas_link_externo:
    `🎓 *Bem-vindo ao {nomePlataforma}, {alunoNome}!* 🚀\n\nSeu cadastro foi confirmado! Acesse a plataforma:\n👉 {appUrl}/entrar\n\n📲 *Próximo passo obrigatório:*\nCadastre-se também na plataforma parceira pelo link abaixo para poder iniciar o treinamento:\n👉 {linkExterno}\n\nApós se cadastrar lá, volte aqui e assista as aulas. A primeira aula já te ensina a usar a plataforma! 🎯\n\n_Bons estudos!_`,

  // ── Contrato ──────────────────────────────────────────────────────────────
  contrato_assinado:
    `📄 *Contrato assinado digitalmente!*\n\nOlá, *{primeiroNome}*! Seu contrato foi registrado.\n\n🔖 *Registro:* {numeroRegistro}\n📅 *Emissão:* {assinadoEm}\n\n📄 *O PDF será enviado em instantes nesta conversa.*\n\n🔐 Hash: {hashParcial}...`,

  // ── Pagamentos ────────────────────────────────────────────────────────────
  pagamento_cliente_confirmado:
    `✅ *Pagamento confirmado!*\n\n{clienteNome}\nValor: *{valor}*\n\nSeu acesso está ativo. Obrigado!`,

  pagamento_gestor_upgrade:
    `🚀 *Bem-vindo ao Plano PRO!*\n\nOlá, {gestorNome}!\n\n✅ Pagamento de *{valor}* confirmado!\n\nSua conta PRO está ativa por 30 dias. Acesse agora:\n👉 {appUrl}/pro\n\n_Use o mesmo e-mail e senha do plano FREE._`,

  pagamento_gestor_renovacao:
    `✅ *Pagamento confirmado!*\n\nOlá, {gestorNome}!\nValor: *{valor}*\n\nSeu acesso PRO está ativo por mais 30 dias. 🎉\n👉 {appUrl}/pro`,

  onboarding_novo_cliente:
    `🎉 *Bem-vindo à plataforma, {contatoNome}!*\n\nSua plataforma está pronta.\n\n🔐 *Clique para definir sua senha e acessar o painel:*\n{linkSenha}\n\n_(Link válido por 24 horas)_\n\n🔗 *Link de cadastro dos consultores:*\n{linkFree}`,

  // ── Sequência de boas-vindas ──────────────────────────────────────────────
  sequencia_dia1:
    `🎓 *Bem-vindo, {alunoNome}!*\n\nSua jornada começa agora. Acesse e assista sua primeira aula:\n👉 {appUrl}/aluno/{whatsapp}\n\nQualquer dúvida, seu PRO *{gestorNome}* está aqui para te ajudar! 💪`,

  sequencia_dia3_sem_aula:
    `⏰ *{alunoNome}*, você se cadastrou há 3 dias mas ainda não assistiu nenhuma aula!\n\nSua formação está te esperando. São apenas alguns minutos por dia que vão mudar seu resultado:\n👉 {appUrl}/entrar\n\nVamos lá? 🚀`,

  sequencia_dia7_sem_aula:
    `🔔 *{alunoNome}*, já faz 1 semana desde o seu cadastro!\n\nSeus colegas já estão avançando. Não fique para trás — cada aula te aproxima do certificado!\n\n👉 {appUrl}/aluno/{whatsapp}\n\nPrecisando de ajuda? Fale com seu PRO *{gestorNome}* agora mesmo! 📞`,

  // ── Inatividade ───────────────────────────────────────────────────────────
  inatividade_aluno_3dias:
    `📚 Olá, *{alunoNome}*! Sentimos sua falta na *{nomePlataforma}*.\n\nFaz 3 dias que você não avança nos estudos. Que tal retomar agora?\n\n👉 {appUrl}/aluno/{whatsapp}`,

  inatividade_aluno_7dias:
    `⏰ *{alunoNome}*, já faz uma semana sem estudar!\n\nSeu progresso está esperando por você na *{nomePlataforma}*. Não perca o fio! 💪\n\n👉 {appUrl}/aluno/{whatsapp}`,

  inatividade_aluno_ndias:
    `🚨 *{alunoNome}*, {dias} dias sem acessar a plataforma!\n\nNão deixe sua formação parar aqui. Volte agora e continue de onde parou.\n\n👉 {appUrl}/aluno/{whatsapp}`,

  inatividade_gestor_3dias:
    `📬 *{gestorNome}*, seu membro FREE *{alunoNome}* está há *3 dias* sem estudar.\n\nUma mensagem sua pode ser tudo que ele precisa para retomar! 💪\n\n📲 Contatar: {wppLink}\n📊 Ver painel: {appUrl}/pro`,

  inatividade_gestor_7dias:
    `⏰ *Atenção, {gestorNome}!*\n\nSeu membro FREE *{alunoNome}* está há *1 semana* sem avançar nos estudos.\n\nEste é o momento certo para um reengajamento direto. Entre em contato agora! 🎯\n\n📲 Contatar: {wppLink}\n📊 Ver painel: {appUrl}/pro`,

  inatividade_gestor_ndias:
    `🚨 *ALERTA, {gestorNome}!*\n\nSeu membro FREE *{alunoNome}* está há *{dias} dias* sem acessar a plataforma.\n\n⚠️ Risco alto de abandono — contato urgente!\n\n📲 Contatar: {wppLink}\n📊 Ver painel: {appUrl}/pro`,

  // ── Cobrança SaaS ─────────────────────────────────────────────────────────
  cobranca_nova:
    `💰 *Cobrança {clienteNome}*\n\nValor: *{valor}*\nVencimento: {vencimento}\n\n*PIX Copia e Cola:*\n{pixCopiaECola}`,

  cobranca_acesso_suspenso:
    `⚠️ *Acesso suspenso — {clienteNome}*\n\nSeu acesso à plataforma foi suspenso por falta de pagamento.\n\nRegularize para reativar imediatamente.`,

  // ── Planos PRO ────────────────────────────────────────────────────────────
  pro_vencimento_3dias:
    `⏰ *Seu plano PRO vence em 3 dias!*\n\nOlá, {gestorNome}! Seu acesso expira em {vencimento}.\n\nRenove agora para não perder acesso à sua equipe:\n👉 {appUrl}/pro/assinar`,

  pro_vencimento_hoje:
    `🔔 *Seu plano PRO vence hoje!*\n\nRenove agora para continuar gerenciando sua equipe FREE:\n👉 {appUrl}/pro/assinar`,

  pro_suspenso:
    `⚠️ *Acesso PRO suspenso*\n\nOlá, {gestorNome}. Seu plano venceu e o acesso foi suspenso.\n\nRegularize para reativar imediatamente:\n👉 {appUrl}/pro/assinar`,

  pro_rede_perdeu_beneficio:
    `⚠️ *Você perdeu o PRO gratuito!*\n\n{membroNome} cancelou o plano PRO e sua rede caiu para *{totalAtivos}/{limite}*.\n\nIndique mais *1 PRO* para recuperar o benefício!\n\n🔗 Link PRO direto:\n{appUrl}/captacao?direto=1&plano=pro`,

  pro_rede_membro_saiu:
    `📉 *{membroNome}* cancelou o plano PRO.\n\nSua rede agora tem *{totalAtivos}/{limite}* PROs ativos. Faltam {faltam} para ter o PRO gratuito.\n\n🔗 Indique mais PROs:\n{appUrl}/captacao?direto=1&plano=pro`,

  pro_reativado_gratuito:
    `🎉 *Seu PRO foi reativado gratuitamente!*\n\nOlá, {gestorNome}! Sua rede voltou a ter *{totalAtivos} PROs ativos*.\n\nSeu plano PRO está ativo por mais 30 dias sem custo.\n\n👉 Acesse: {appUrl}/pro`,

  // ── Quiz / progresso ──────────────────────────────────────────────────────
  modulo_concluido_gestor:
    `📚 *{gestorNome}!* Seu membro FREE *{alunoNome}* concluiu o *Módulo {moduloOrdem}: {moduloTitulo}*! 🎉`,

  modulo_concluido_aluno:
    `🎉 Parabéns, *{alunoNome}*!\n\nVocê concluiu o *Módulo {moduloOrdem}: {moduloTitulo}*! 🏆\n\nContinue acessando a plataforma:\n👉 {appUrl}/aluno/{whatsapp}`,

  formacao_concluida_gestor:
    `🏆 *PARABÉNS, {gestorNome}!*\n\nSeu membro FREE *{alunoNome}* concluiu *100% da formação!* 🎓✨\n\nVer progresso: {appUrl}/aluno/{whatsapp}`,

  formacao_concluida_aluno:
    `🎓 *PARABÉNS, {alunoNome}!*\n\nVocê concluiu 100% da formação! 🏆✨\n\nCrie sua arte de formatura:\n👉 {appUrl}/aluno/{whatsapp}/artes`,

  // ── Validade de certificação ───────────────────────────────────────────────
  validade_expira_7dias:
    `⚠️ *{alunoNome}*, sua certificação na aula *"{aulaTitle}"* expira em *7 dias*!\n\nPara manter seu certificado válido, você precisará refazer o quiz desta aula.\n\n👉 {appUrl}/entrar`,

  validade_expira_amanha:
    `🚨 *{alunoNome}*, sua certificação em *"{aulaTitle}"* expira *AMANHÃ*!\n\nAcesse agora e refaça o quiz para não perder:\n👉 {appUrl}/entrar`,

  // ── Lembrete aula ao vivo ─────────────────────────────────────────────────
  lembrete_ao_vivo:
    `*Lembrete: Aula ao Vivo em 1 hora!*\n\n📚 *{titulo}*\n{descricao}\n🕐 *Horário:* {dataHora}\n⏱️ *Duração:* {duracao} minutos\n📺 *Plataforma:* {plataforma}\n\n🔗 *Acesse agora:*\n{link}\n\n{presenca}`,
}

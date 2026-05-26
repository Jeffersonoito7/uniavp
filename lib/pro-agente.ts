import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { criarCobrancaPix } from '@/lib/efi'
import {
  getSaldo, debitarCreditos, getPacotes, getSessao, setSessao, limparSessao,
  getConfig, getArgumentos, garantirRegistroCredito, CUSTO_ACAO,
} from '@/lib/agente-creditos'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// ── Tipos internos ────────────────────────────────────────────────────────────
type ToolInput = Record<string, unknown>

// ── Ferramentas disponíveis para o agente ────────────────────────────────────
const tools = [
  {
    name: 'registrar_cotacao',
    description: 'Registra uma cotação feita pelo PRO. Use quando ele disser que fez uma cotação, visita, proposta ou reunião com um cliente.',
    input_schema: {
      type: 'object',
      properties: {
        descricao: { type: 'string', description: 'Descrição da cotação (nome do cliente, produto, etc)' },
        data: { type: 'string', description: 'Data no formato YYYY-MM-DD. Use hoje se não informado.' },
      },
      required: ['descricao', 'data'],
    },
  },
  {
    name: 'registrar_adesao',
    description: 'Registra uma venda/adesão fechada. Use quando o PRO disser que fechou, vendeu ou fez uma adesão.',
    input_schema: {
      type: 'object',
      properties: {
        descricao: { type: 'string', description: 'Descrição da venda (nome do cliente, produto)' },
        valor: { type: 'number', description: 'Valor em reais' },
        data: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
      },
      required: ['descricao', 'valor', 'data'],
    },
  },
  {
    name: 'registrar_despesa',
    description: 'Registra uma despesa ou gasto do PRO.',
    input_schema: {
      type: 'object',
      properties: {
        descricao: { type: 'string', description: 'Descrição do gasto' },
        valor: { type: 'number', description: 'Valor em reais' },
        data: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
      },
      required: ['descricao', 'valor', 'data'],
    },
  },
  {
    name: 'criar_lembrete',
    description: 'Cria um lembrete para o PRO. Use quando ele pedir para ser lembrado de algo.',
    input_schema: {
      type: 'object',
      properties: {
        mensagem: { type: 'string', description: 'O que deve ser lembrado' },
        lembrar_em: { type: 'string', description: 'Data e hora ISO 8601 (ex: 2024-05-16T14:00:00-03:00)' },
      },
      required: ['mensagem', 'lembrar_em'],
    },
  },
  {
    name: 'buscar_resumo',
    description: 'Busca o resumo financeiro do PRO. Use quando ele pedir resumo, relatório, balanço, total do mês, etc.',
    input_schema: {
      type: 'object',
      properties: {
        periodo: { type: 'string', enum: ['hoje', 'semana', 'mes'], description: 'Período do relatório' },
      },
      required: ['periodo'],
    },
  },
  {
    name: 'buscar_equipe',
    description: 'Busca informações sobre a equipe FREE do PRO na plataforma.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'listar_lembretes',
    description: 'Lista os próximos lembretes pendentes do PRO.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
]

// ── Execução das ferramentas ──────────────────────────────────────────────────
async function executarFerramenta(
  nome: string,
  input: ToolInput,
  gestorId: string,
  admin: ReturnType<typeof createServiceRoleClient>
): Promise<string> {
  const hoje = new Date().toISOString().split('T')[0]

  if (nome === 'registrar_cotacao') {
    await admin.from('pro_registros').insert({
      gestor_id: gestorId, tipo: 'cotacao',
      descricao: input.descricao as string, data: (input.data as string) || hoje,
    })
    const { count } = await admin.from('pro_registros')
      .select('id', { count: 'exact', head: true })
      .eq('gestor_id', gestorId).eq('tipo', 'cotacao')
      .gte('data', hoje.slice(0, 7) + '-01')
    return `✅ Cotação registrada!\n\nVocê tem *${count} cotações* este mês.`
  }

  if (nome === 'registrar_adesao') {
    await admin.from('pro_registros').insert({
      gestor_id: gestorId, tipo: 'adesao',
      descricao: input.descricao as string, valor: input.valor as number, data: (input.data as string) || hoje,
    })
    const { data: adesoes } = await admin.from('pro_registros')
      .select('valor').eq('gestor_id', gestorId).eq('tipo', 'adesao')
      .gte('data', hoje.slice(0, 7) + '-01')
    const totalMes = (adesoes ?? []).reduce((s, a) => s + Number(a.valor), 0)
    return `💰 Adesão de *R$ ${Number(input.valor).toFixed(2).replace('.', ',')}* registrada!\n\nTotal de adesões este mês: *R$ ${totalMes.toFixed(2).replace('.', ',')}*`
  }

  if (nome === 'registrar_despesa') {
    await admin.from('pro_registros').insert({
      gestor_id: gestorId, tipo: 'despesa',
      descricao: input.descricao as string, valor: input.valor as number, data: (input.data as string) || hoje,
    })
    return `💸 Despesa de *R$ ${Number(input.valor).toFixed(2).replace('.', ',')}* registrada!\n_${input.descricao}_`
  }

  if (nome === 'criar_lembrete') {
    await admin.from('pro_lembretes').insert({
      gestor_id: gestorId, mensagem: input.mensagem as string, lembrar_em: input.lembrar_em as string,
    })
    const dt = new Date(input.lembrar_em as string)
    const formatado = dt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })
    return `⏰ Lembrete criado!\n\n*${input.mensagem}*\n📅 ${formatado}`
  }

  if (nome === 'buscar_resumo') {
    const periodo = input.periodo as string
    const inicio = (p: string) => {
      const d = new Date()
      if (p === 'hoje') return hoje
      if (p === 'semana') { d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0] }
      return hoje.slice(0, 7) + '-01'
    }
    const desde = inicio(periodo)
    const { data: registros } = await admin.from('pro_registros')
      .select('tipo, valor').eq('gestor_id', gestorId).gte('data', desde)

    const cotacoes = (registros ?? []).filter(r => r.tipo === 'cotacao').length
    const adesoes = (registros ?? []).filter(r => r.tipo === 'adesao')
    const despesas = (registros ?? []).filter(r => r.tipo === 'despesa')
    const totalAdesoes = adesoes.reduce((s, a) => s + Number(a.valor), 0)
    const totalDespesas = despesas.reduce((s, a) => s + Number(a.valor), 0)
    const lucro = totalAdesoes - totalDespesas
    const conversao = cotacoes > 0 ? ((adesoes.length / cotacoes) * 100).toFixed(0) : '0'
    const label = periodo === 'hoje' ? 'hoje' : periodo === 'semana' ? 'nos últimos 7 dias' : 'este mês'

    return `📊 *Resumo ${label}*\n\n` +
      `📋 Cotações: *${cotacoes}*\n` +
      `✅ Adesões: *${adesoes.length}* (R$ ${totalAdesoes.toFixed(2).replace('.', ',')})\n` +
      `💸 Despesas: *${despesas.length}* (R$ ${totalDespesas.toFixed(2).replace('.', ',')})\n` +
      `💰 Lucro líquido: *R$ ${lucro.toFixed(2).replace('.', ',')}*\n` +
      `🎯 Taxa de conversão: *${conversao}%*`
  }

  if (nome === 'buscar_equipe') {
    // Busca whatsapp do gestor para filtrar alunos por gestor_whatsapp
    const { data: gestorRow } = await admin.from('gestores')
      .select('whatsapp').eq('id', gestorId).maybeSingle()
    const gestorWpp = gestorRow?.whatsapp ?? ''
    const { data: consultores } = await admin.from('alunos')
      .select('nome, status, created_at').eq('gestor_whatsapp', gestorWpp)
      .order('created_at', { ascending: false }).limit(5)
    const total = consultores?.length ?? 0
    const lista = (consultores ?? []).map(c => `• ${c.nome}`).join('\n')
    return `👥 *Sua equipe FREE*\n\n${total} membro${total !== 1 ? 's' : ''} ativo${total !== 1 ? 's' : ''}${lista ? '\n\n*Últimos cadastrados:*\n' + lista : ''}`
  }

  if (nome === 'listar_lembretes') {
    const { data: lembretes } = await admin.from('pro_lembretes')
      .select('mensagem, lembrar_em').eq('gestor_id', gestorId).eq('enviado', false)
      .gte('lembrar_em', new Date().toISOString()).order('lembrar_em').limit(5)
    if (!lembretes?.length) return '📭 Nenhum lembrete pendente.'
    const lista = lembretes.map(l => {
      const dt = new Date(l.lembrar_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })
      return `⏰ ${dt} — ${l.mensagem}`
    }).join('\n')
    return `📅 *Seus próximos lembretes:*\n\n${lista}`
  }

  return 'Operação executada.'
}

// ── Classifica a mensagem para determinar custo em créditos ──────────────────
function classificarAcao(mensagem: string): keyof typeof CUSTO_ACAO {
  const m = mensagem.toLowerCase()
  if (m.includes('compar') || m.includes('concorrent') || m.includes('cotação') && m.length > 100) return 'comparar'
  if (m.includes('script') || m.includes('argumento') || m.includes('objeção') || m.includes('como convencer')) return 'script'
  if (m.includes('resumo') || m.includes('relatório') || m.includes('balanço') || m.includes('saldo')) return 'resumo'
  if (m.includes('equipe') || m.includes('minha equipe') || m.includes('meus consultores')) return 'equipe'
  if (m.includes('lembrete') || m.includes('me lembra')) return 'lembrete'
  return 'mensagem'
}

// ── Fluxo de comparação de cotações ──────────────────────────────────────────
async function processarComparacao(
  mensagem: string,
  sessao: { estado: string; dados: Record<string, unknown> } | null,
  gestorId: string,
  nomeGestor: string,
  tenantId: string | null,
  admin: ReturnType<typeof createServiceRoleClient>
): Promise<{ resposta: string; consumiuCredito: boolean }> {
  // Usuário quer iniciar comparação
  const querComparar = /compar|concorrent/i.test(mensagem) && !sessao

  if (querComparar) {
    await setSessao(gestorId, 'comparar_aguardando_autovale', {}, admin)
    return {
      resposta: `📋 *Comparação de cotações*\n\nVou analisar as duas cotações e montar seus argumentos de venda.\n\n*Passo 1 de 2:* Cole aqui a cotação da AutoVale (valores, coberturas, franquias, etc).`,
      consumiuCredito: false,
    }
  }

  if (sessao?.estado === 'comparar_aguardando_autovale') {
    await setSessao(gestorId, 'comparar_aguardando_concorrente', { cotacao_autovale: mensagem }, admin)
    return {
      resposta: `✅ Cotação AutoVale recebida!\n\n*Passo 2 de 2:* Agora cole a cotação do concorrente.`,
      consumiuCredito: false,
    }
  }

  if (sessao?.estado === 'comparar_aguardando_concorrente') {
    const cotacaoAutovale = String(sessao.dados.cotacao_autovale ?? '')
    const cotacaoConcorrente = mensagem

    // Verifica e debita créditos antes de chamar o Claude
    const custo = CUSTO_ACAO.comparar
    const debito = await debitarCreditos(gestorId, custo, 'Comparação de cotações', tenantId, admin)
    if (!debito.ok) {
      await limparSessao(gestorId, admin)
      return {
        resposta: `❌ *Saldo insuficiente*\n\nVocê precisa de *${custo} créditos* para usar a comparação de cotações.\n\nSaldo atual: *${debito.saldoAtual} créditos*\n\nDigite *recarregar* para ver os pacotes disponíveis.`,
        consumiuCredito: false,
      }
    }

    await limparSessao(gestorId, admin)

    const argumentos = await getArgumentos(tenantId, admin)
    const listaArgumentos = argumentos.length > 0
      ? argumentos.map((a, i) => `${i + 1}. ${a}`).join('\n')
      : 'Atendimento personalizado, rede credenciada, suporte 24h, empresa sólida.'

    if (!ANTHROPIC_API_KEY) {
      return { resposta: '⚠️ Assistente de comparação temporariamente indisponível.', consumiuCredito: true }
    }

    const systemPrompt = `Você é um especialista em vendas de proteção veicular da AutoVale.
Seu objetivo é ajudar o consultor ${nomeGestor} a GANHAR a venda comparando as cotações.

DIFERENCIAIS DA AUTOVALE:
${listaArgumentos}

INSTRUÇÕES:
- Analise as duas cotações com imparcialidade técnica
- Destaque CADA ponto onde a AutoVale supera o concorrente
- Se algum item do concorrente parecer melhor, reconheça brevemente MAS redirecione para o valor agregado da AutoVale
- Sempre termine com uma frase de fechamento poderosa
- Use emojis, negrito com *asteriscos*, seja direto e motivador
- Máximo 30 linhas — o consultor vai ler no celular durante a abordagem`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: `COTAÇÃO AUTOVALE:\n${cotacaoAutovale}\n\nCOTAÇÃO CONCORRENTE:\n${cotacaoConcorrente}\n\nMonte a análise comparativa e os argumentos de venda.`,
          }],
        }),
      })
      const data = await res.json() as { content?: Array<{ type: string; text?: string }> }
      const texto = data.content?.find(c => c.type === 'text')?.text ?? 'Análise indisponível.'
      return { resposta: texto, consumiuCredito: true }
    } catch {
      return { resposta: '⚠️ Erro ao processar comparação. Tente novamente.', consumiuCredito: true }
    }
  }

  return { resposta: '', consumiuCredito: false }
}

// ── Fluxo de recarga via WhatsApp ────────────────────────────────────────────
async function processarRecarga(
  mensagem: string,
  sessao: { estado: string; dados: Record<string, unknown> } | null,
  gestorId: string,
  nomeGestor: string,
  tenantId: string | null,
  admin: ReturnType<typeof createServiceRoleClient>
): Promise<string | null> {
  const querRecarregar = /recarreg|crédito|saldo/i.test(mensagem) && !sessao

  if (querRecarregar) {
    const [pacotes, saldo] = await Promise.all([
      getPacotes(tenantId, admin),
      getSaldo(gestorId, admin),
    ])

    if (!pacotes.length) {
      return `💳 *Seus Créditos*\n\nSaldo atual: *${saldo} créditos*\n\nNenhum pacote disponível no momento. Entre em contato com o suporte.`
    }

    const lista = pacotes.map((p, i) =>
      `*${i + 1}.* ${p.nome} — ${p.creditos} créditos por R$ ${Number(p.valor).toFixed(2).replace('.', ',')}`
    ).join('\n')

    await setSessao(gestorId, 'recarregar_escolha_pacote', { pacotes: JSON.stringify(pacotes) }, admin)

    return `💳 *Recarregar Créditos*\n\nSaldo atual: *${saldo} créditos*\n\n*Escolha um pacote:*\n${lista}\n\nDigite o número do pacote desejado.`
  }

  if (sessao?.estado === 'recarregar_escolha_pacote') {
    const escolha = parseInt(mensagem.trim())
    let pacotes: Array<{ id: string; nome: string; creditos: number; valor: number }>
    try {
      pacotes = JSON.parse(String(sessao.dados.pacotes ?? '[]'))
    } catch {
      pacotes = []
    }

    if (isNaN(escolha) || escolha < 1 || escolha > pacotes.length) {
      return `Por favor, digite apenas o número do pacote (1 a ${pacotes.length}).`
    }

    const pacote = pacotes[escolha - 1]
    await limparSessao(gestorId, admin)

    // Gera o PIX
    try {
      const txid = `agente${gestorId.replace(/-/g, '').slice(0, 20)}${Date.now()}`
      const vencimento = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { pixCopiaECola } = await criarCobrancaPix({
        txid,
        valor: Number(pacote.valor),
        vencimento,
        nomeDevedor: nomeGestor,
        descricao: `Créditos do assistente IA — ${pacote.nome}`,
      })

      // Registra a recarga pendente
      await admin.from('agente_recargas').insert({
        gestor_id: gestorId,
        tenant_id: tenantId,
        pacote_id: pacote.id,
        creditos: pacote.creditos,
        valor: pacote.valor,
        txid,
        status: 'pendente',
      })

      return `💳 *Pacote ${pacote.nome}*\n*${pacote.creditos} créditos* por R$ ${Number(pacote.valor).toFixed(2).replace('.', ',')}\n\n*PIX Copia e Cola:*\n\`${pixCopiaECola}\`\n\n_Após o pagamento seus créditos serão adicionados automaticamente em até 1 minuto._`
    } catch {
      return '❌ Erro ao gerar o PIX. Tente novamente ou entre em contato com o suporte.'
    }
  }

  return null
}

// ── Processamento principal da mensagem PRO ──────────────────────────────────
export async function processarMensagemPRO(whatsapp: string, mensagem: string): Promise<string | null> {
  if (!ANTHROPIC_API_KEY) return '⚠️ Assistente temporariamente indisponível.'

  const admin = createServiceRoleClient()

  const numero = whatsapp.replace(/\D/g, '').replace(/^55/, '')
  const { data: gestor } = await admin.from('gestores')
    .select('id, nome, tenant_id').eq('whatsapp', numero).eq('ativo', true).maybeSingle()

  if (!gestor) return null

  const tenantId = gestor.tenant_id ?? null

  // Garante que o gestor tem registro de créditos
  await garantirRegistroCredito(gestor.id, tenantId, admin)

  // Verifica configuração do agente
  const config = await getConfig(tenantId, admin)
  if (config && !config.ativo) return null

  // Lê sessão ativa (estado de conversa de múltiplos passos)
  const sessao = await getSessao(gestor.id, admin)

  // ── Fluxo de recarga ────────────────────────────────────────────────────────
  const respostaRecarga = await processarRecarga(mensagem, sessao, gestor.id, gestor.nome, tenantId, admin)
  if (respostaRecarga !== null) return respostaRecarga

  // ── Fluxo de comparação ─────────────────────────────────────────────────────
  const estaEmComparacao = sessao?.estado.startsWith('comparar_')
  const querComparar = /compar|concorrent/i.test(mensagem)
  if (estaEmComparacao || querComparar) {
    const { resposta } = await processarComparacao(mensagem, sessao, gestor.id, gestor.nome, tenantId, admin)
    if (resposta) return resposta
  }

  // ── Mensagens normais (agente com ferramentas) ───────────────────────────────
  const acao = classificarAcao(mensagem)
  const custo = CUSTO_ACAO[acao] ?? 1

  const saldo = await getSaldo(gestor.id, admin)
  if (saldo < custo) {
    return `❌ *Saldo insuficiente*\n\nVocê precisa de *${custo} crédito${custo > 1 ? 's' : ''}* para esta ação.\n\nSaldo atual: *${saldo} créditos*\n\nDigite *recarregar* para ver os pacotes disponíveis.`
  }

  const nomeAssistente = config?.nome_assistente ?? 'Assistente'
  const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long' })

  const systemPrompt = `Você é ${nomeAssistente}, assistente pessoal de ${gestor.nome}, consultor PRO.
Hoje é ${hoje} (horário de Brasília).${config?.prompt_extra ? '\n\n' + config.prompt_extra : ''}

Você ajuda o PRO a:
- Registrar cotações, adesões e despesas do dia a dia
- Criar lembretes de compromissos
- Ver resumos e relatórios financeiros
- Consultar informações da equipe na plataforma

Seja direto, amigável e use emojis. Responda sempre em português do Brasil.
Quando o PRO informar dados financeiros, use as ferramentas para registrar.
Para datas relativas como "hoje", "ontem", "amanhã", calcule baseado na data atual.`

  type ClaudeMessage = { role: 'user' | 'assistant'; content: unknown }
  const messages: ClaudeMessage[] = [{ role: 'user', content: mensagem }]
  let resposta = ''

  for (let i = 0; i < 3; i++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        tools,
        messages,
      }),
    })

    const data = await res.json() as {
      stop_reason?: string
      content?: Array<{ type: string; text?: string; id?: string; name?: string; input?: ToolInput }>
    }
    if (!res.ok) break

    messages.push({ role: 'assistant', content: data.content })

    if (data.stop_reason === 'end_turn') {
      resposta = data.content?.find(c => c.type === 'text')?.text ?? ''
      break
    }

    if (data.stop_reason === 'tool_use') {
      const resultados: Array<{ type: string; tool_use_id: string; content: string }> = []
      for (const bloco of (data.content ?? [])) {
        if (bloco.type === 'tool_use' && bloco.id && bloco.name && bloco.input) {
          const resultado = await executarFerramenta(bloco.name, bloco.input, gestor.id, admin)
          resultados.push({ type: 'tool_result', tool_use_id: bloco.id, content: resultado })
          resposta = resultado
        }
      }
      messages.push({ role: 'user', content: resultados })
    }
  }

  // Debita créditos após resposta bem-sucedida
  if (resposta) {
    await debitarCreditos(gestor.id, custo, `Ação: ${acao}`, tenantId, admin)
  }

  return resposta || 'Entendi! Como posso ajudar mais?'
}

// ── Conceder créditos de boas-vindas ao ativar o PRO ─────────────────────────
export async function concederCreditosBoasVindas(
  gestorId: string,
  tenantId: string | null,
  admin: ReturnType<typeof createServiceRoleClient>
): Promise<void> {
  await garantirRegistroCredito(gestorId, tenantId, admin)

  const config = await getConfig(tenantId, admin)
  const quantidade = config?.creditos_boas_vindas ?? 50

  // Só concede se ainda não recebeu boas-vindas (saldo zerado = nunca recebeu)
  const saldo = await getSaldo(gestorId, admin)
  if (saldo > 0) return

  const { creditarCreditos } = await import('@/lib/agente-creditos')
  await creditarCreditos(gestorId, quantidade, 'Créditos de boas-vindas', tenantId, admin, { tipo: 'bonus' })
}

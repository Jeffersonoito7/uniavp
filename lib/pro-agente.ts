import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// Ferramentas disponíveis para o agente
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
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'listar_lembretes',
    description: 'Lista os próximos lembretes pendentes do PRO.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
]

async function executarFerramenta(nome: string, input: any, gestorId: string, admin: any): Promise<string> {
  const hoje = new Date().toISOString().split('T')[0]

  if (nome === 'registrar_cotacao') {
    await (admin.from('pro_registros') as any).insert({
      gestor_id: gestorId, tipo: 'cotacao',
      descricao: input.descricao, data: input.data || hoje,
    })
    const { count } = await (admin.from('pro_registros') as any)
      .select('id', { count: 'exact', head: true })
      .eq('gestor_id', gestorId).eq('tipo', 'cotacao')
      .gte('data', hoje.slice(0, 7) + '-01')
    return `✅ Cotação registrada!\n\nVocê tem *${count} cotações* este mês.`
  }

  if (nome === 'registrar_adesao') {
    await (admin.from('pro_registros') as any).insert({
      gestor_id: gestorId, tipo: 'adesao',
      descricao: input.descricao, valor: input.valor, data: input.data || hoje,
    })
    const { data: adesoes } = await (admin.from('pro_registros') as any)
      .select('valor').eq('gestor_id', gestorId).eq('tipo', 'adesao')
      .gte('data', hoje.slice(0, 7) + '-01')
    const totalMes = (adesoes ?? []).reduce((s: number, a: any) => s + Number(a.valor), 0)
    return `💰 Adesão de *R$ ${Number(input.valor).toFixed(2).replace('.', ',')}* registrada!\n\nTotal de adesões este mês: *R$ ${totalMes.toFixed(2).replace('.', ',')}*`
  }

  if (nome === 'registrar_despesa') {
    await (admin.from('pro_registros') as any).insert({
      gestor_id: gestorId, tipo: 'despesa',
      descricao: input.descricao, valor: input.valor, data: input.data || hoje,
    })
    return `💸 Despesa de *R$ ${Number(input.valor).toFixed(2).replace('.', ',')}* registrada!\n_${input.descricao}_`
  }

  if (nome === 'criar_lembrete') {
    await (admin.from('pro_lembretes') as any).insert({
      gestor_id: gestorId, mensagem: input.mensagem, lembrar_em: input.lembrar_em,
    })
    const dt = new Date(input.lembrar_em)
    const formatado = dt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })
    return `⏰ Lembrete criado!\n\n*${input.mensagem}*\n📅 ${formatado}`
  }

  if (nome === 'buscar_resumo') {
    const inicio = periodo => {
      const d = new Date()
      if (periodo === 'hoje') return hoje
      if (periodo === 'semana') { d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0] }
      return hoje.slice(0, 7) + '-01'
    }
    const desde = inicio(input.periodo)
    const { data: registros } = await (admin.from('pro_registros') as any)
      .select('tipo, valor').eq('gestor_id', gestorId).gte('data', desde)

    const cotacoes = (registros ?? []).filter((r: any) => r.tipo === 'cotacao').length
    const adesoes = (registros ?? []).filter((r: any) => r.tipo === 'adesao')
    const despesas = (registros ?? []).filter((r: any) => r.tipo === 'despesa')
    const totalAdesoes = adesoes.reduce((s: number, a: any) => s + Number(a.valor), 0)
    const totalDespesas = despesas.reduce((s: number, a: any) => s + Number(a.valor), 0)
    const lucro = totalAdesoes - totalDespesas
    const conversao = cotacoes > 0 ? ((adesoes.length / cotacoes) * 100).toFixed(0) : '0'
    const label = input.periodo === 'hoje' ? 'hoje' : input.periodo === 'semana' ? 'nos últimos 7 dias' : 'este mês'

    return `📊 *Resumo ${label}*\n\n` +
      `📋 Cotações: *${cotacoes}*\n` +
      `✅ Adesões: *${adesoes.length}* (R$ ${totalAdesoes.toFixed(2).replace('.', ',')})\n` +
      `💸 Despesas: *${despesas.length}* (R$ ${totalDespesas.toFixed(2).replace('.', ',')})\n` +
      `💰 Lucro líquido: *R$ ${lucro.toFixed(2).replace('.', ',')}*\n` +
      `🎯 Taxa de conversão: *${conversao}%*`
  }

  if (nome === 'buscar_equipe') {
    const { data: consultores } = await (admin.from('alunos') as any)
      .select('nome, status, created_at').eq('gestor_id', gestorId).eq('ativo', true).order('created_at', { ascending: false }).limit(5)
    const total = consultores?.length ?? 0
    const lista = (consultores ?? []).map((c: any) => `• ${c.nome}`).join('\n')
    return `👥 *Sua equipe FREE*\n\n${total} membro${total !== 1 ? 's' : ''} ativo${total !== 1 ? 's' : ''}${lista ? '\n\n*Últimos cadastrados:*\n' + lista : ''}`
  }

  if (nome === 'listar_lembretes') {
    const { data: lembretes } = await (admin.from('pro_lembretes') as any)
      .select('mensagem, lembrar_em').eq('gestor_id', gestorId).eq('enviado', false)
      .gte('lembrar_em', new Date().toISOString()).order('lembrar_em').limit(5)
    if (!lembretes?.length) return '📭 Nenhum lembrete pendente.'
    const lista = lembretes.map((l: any) => {
      const dt = new Date(l.lembrar_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })
      return `⏰ ${dt} — ${l.mensagem}`
    }).join('\n')
    return `📅 *Seus próximos lembretes:*\n\n${lista}`
  }

  return 'Operação executada.'
}

export async function processarMensagemPRO(whatsapp: string, mensagem: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) return '⚠️ Assistente temporariamente indisponível.'

  const admin = createServiceRoleClient()

  // Busca o gestor pelo WhatsApp
  const numero = whatsapp.replace(/\D/g, '').replace(/^55/, '')
  const { data: gestor } = await (admin.from('gestores') as any)
    .select('id, nome').eq('whatsapp', numero).eq('ativo', true).maybeSingle()

  if (!gestor) return null as any // Não é PRO, ignora

  const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long' })

  const systemPrompt = `Você é o assistente pessoal de ${gestor.nome}, um consultor PRO da UNIAVP.
Hoje é ${hoje} (horário de Brasília).

Você ajuda o PRO a:
- Registrar cotações, adesões e despesas do dia a dia
- Criar lembretes de compromissos
- Ver resumos e relatórios financeiros
- Consultar informações da equipe na plataforma

Seja direto, amigável e use emojis. Responda sempre em português do Brasil.
Quando o PRO informar dados financeiros, use as ferramentas para registrar.
Para datas relativas como "hoje", "ontem", "amanhã", calcule baseado na data atual.`

  let messages: any[] = [{ role: 'user', content: mensagem }]
  let resposta = ''

  // Loop do agente (até 3 iterações)
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

    const data = await res.json()
    if (!res.ok) break

    messages.push({ role: 'assistant', content: data.content })

    // Se parou sem usar ferramenta
    if (data.stop_reason === 'end_turn') {
      resposta = data.content.find((c: any) => c.type === 'text')?.text ?? ''
      break
    }

    // Executa ferramentas
    if (data.stop_reason === 'tool_use') {
      const resultados: any[] = []
      for (const bloco of data.content) {
        if (bloco.type === 'tool_use') {
          const resultado = await executarFerramenta(bloco.name, bloco.input, gestor.id, admin)
          resultados.push({ type: 'tool_result', tool_use_id: bloco.id, content: resultado })
          resposta = resultado // usa como resposta se não houver texto final
        }
      }
      messages.push({ role: 'user', content: resultados })
    }
  }

  return resposta || 'Entendi! Como posso ajudar mais?'
}

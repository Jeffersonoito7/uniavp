import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getConfig, getArgumentos, getSaldo, debitarCreditos, garantirRegistroCredito } from '@/lib/agente-creditos'

export const dynamic = 'force-dynamic'

const MODELO_PADRAO = 'claude-haiku-4-5-20251001'

// Modelos que suportam PDF via document block
const MODELOS_PDF = ['claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5-20251001']

function buildSystemPrompt(nomeAssistente: string, promptExtra: string | null, argumentos: string[]) {
  let prompt = `Você é ${nomeAssistente}, um assistente comercial especializado em proteção veicular.

Você ajuda consultores a:
- Criar argumentos convincentes para fechar vendas
- Superar objeções de clientes (preço, confiança, cobertura, concorrentes)
- Criar scripts de abordagem e follow-up
- Dar dicas práticas de fechamento
- Analisar cotações e documentos do concorrente e apontar os diferenciais da associação

Quando receber uma imagem ou documento, leia o conteúdo e destaque imediatamente os pontos fracos do concorrente e como a associação é melhor. Seja direto, objetivo e focado em resultados. Máximo 5 parágrafos.`

  if (argumentos.length > 0) {
    prompt += `\n\n## ARGUMENTOS COMERCIAIS\n${argumentos.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
  }

  if (promptExtra?.trim()) {
    prompt += `\n\n## INSTRUÇÕES ESPECÍFICAS\n${promptExtra}`
  }

  return prompt
}

type AnexoPayload = { data: string; type: string; name: string }

function buildMensagemComAnexo(content: string, anexo: AnexoPayload): unknown {
  const blocos: unknown[] = []

  if (anexo.type === 'application/pdf') {
    blocos.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: anexo.data },
    })
  } else {
    const mediaType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(anexo.type)
      ? anexo.type
      : 'image/jpeg'
    blocos.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: anexo.data },
    })
  }

  if (content.trim()) {
    blocos.push({ type: 'text', text: content })
  }

  return { role: 'user', content: blocos }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { messages, attachment } = body as { messages: { role: string; content: string }[]; attachment?: AnexoPayload }

  if (!messages?.length) return NextResponse.json({ error: 'Mensagens obrigatórias' }, { status: 400 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await adminClient.from('gestores')
    .select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!gestor) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const tenantId = gestor.tenant_id ?? null

  await garantirRegistroCredito(gestor.id, tenantId, adminClient)

  // Custo: 1 para texto, 2 para imagem, 3 para PDF
  const custo = attachment
    ? (attachment.type === 'application/pdf' ? 3 : 2)
    : 1

  const saldo = await getSaldo(gestor.id, adminClient)
  if (saldo < custo) return NextResponse.json({ error: 'Créditos insuficientes', semCredito: true }, { status: 402 })

  const [config, argumentos] = await Promise.all([
    getConfig(tenantId, adminClient),
    getArgumentos(tenantId, adminClient),
  ])

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })

  const nomeAssistente = config?.nome_assistente ?? 'Assistente'
  const modelo = config?.modelo ?? MODELO_PADRAO
  const systemPrompt = buildSystemPrompt(nomeAssistente, config?.prompt_extra ?? null, argumentos)

  // Monta as mensagens para o Anthropic
  // O anexo vai junto com a última mensagem do usuário
  const historico = messages.slice(-20)
  const anthropicMessages = historico.map((m, i) => {
    if (i === historico.length - 1 && m.role === 'user' && attachment) {
      return buildMensagemComAnexo(m.content, attachment)
    }
    return { role: m.role, content: m.content }
  })

  // PDF requer modelo compatível — força sonnet se o modelo configurado não suporta
  const modeloFinal = attachment?.type === 'application/pdf' && !MODELOS_PDF.includes(modelo)
    ? 'claude-haiku-4-5-20251001'
    : modelo

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: modeloFinal,
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: err.error?.message ?? 'Erro no assistente' }, { status: 500 })
  }

  const data = await res.json()
  const texto = data.content?.[0]?.text ?? 'Não consegui processar. Tente novamente.'

  const descricao = attachment
    ? `Assistente comercial — ${attachment.type === 'application/pdf' ? 'PDF' : 'imagem'} anexada`
    : 'Assistente comercial'
  await debitarCreditos(gestor.id, custo, descricao, tenantId, adminClient)
  const novoSaldo = await getSaldo(gestor.id, adminClient)

  return NextResponse.json({ resposta: texto, saldo: novoSaldo })
}

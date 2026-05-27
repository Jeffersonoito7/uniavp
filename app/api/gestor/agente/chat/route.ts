import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getConfig, getArgumentos, getSaldo, debitarCreditos, garantirRegistroCredito } from '@/lib/agente-creditos'

export const dynamic = 'force-dynamic'

const MODELO_PADRAO = 'claude-haiku-4-5-20251001'

function buildSystemPrompt(nomeAssistente: string, promptExtra: string | null, argumentos: string[]) {
  let prompt = `Você é ${nomeAssistente}, um assistente comercial especializado em proteção veicular.

Você ajuda consultores a:
- Criar argumentos convincentes para fechar vendas
- Superar objeções de clientes (preço, confiança, cobertura, concorrentes)
- Criar scripts de abordagem e follow-up
- Dar dicas práticas de fechamento
- Comparar condições da associação com concorrentes

Seja direto, objetivo e focado em resultados. Respostas claras, máximo 5 parágrafos.`

  if (argumentos.length > 0) {
    prompt += `\n\n## ARGUMENTOS COMERCIAIS\n${argumentos.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
  }

  if (promptExtra?.trim()) {
    prompt += `\n\n## INSTRUÇÕES ESPECÍFICAS\n${promptExtra}`
  }

  return prompt
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { messages } = body
  if (!messages?.length) return NextResponse.json({ error: 'Mensagens obrigatórias' }, { status: 400 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await adminClient.from('gestores')
    .select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!gestor) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const tenantId = gestor.tenant_id ?? null

  await garantirRegistroCredito(gestor.id, tenantId, adminClient)

  const saldo = await getSaldo(gestor.id, adminClient)
  if (saldo < 1) return NextResponse.json({ error: 'Créditos insuficientes', semCredito: true }, { status: 402 })

  const [config, argumentos] = await Promise.all([
    getConfig(tenantId, adminClient),
    getArgumentos(tenantId, adminClient),
  ])

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })

  const nomeAssistente = config?.nome_assistente ?? 'Assistente'
  const modelo = config?.modelo ?? MODELO_PADRAO
  const systemPrompt = buildSystemPrompt(nomeAssistente, config?.prompt_extra ?? null, argumentos)

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.slice(-20),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: err.error?.message ?? 'Erro no assistente' }, { status: 500 })
  }

  const data = await res.json()
  const texto = data.content?.[0]?.text ?? 'Não consegui processar. Tente novamente.'

  await debitarCreditos(gestor.id, 1, 'Assistente comercial', tenantId, adminClient)
  const novoSaldo = await getSaldo(gestor.id, adminClient)

  return NextResponse.json({ resposta: texto, saldo: novoSaldo })
}

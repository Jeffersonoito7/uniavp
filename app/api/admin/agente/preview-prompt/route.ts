import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { getConfig, getArgumentos } from '@/lib/agente-creditos'

export const dynamic = 'force-dynamic'

type ModuloResumo = { titulo: string; ordem: number; aulas: { titulo: string; ordem: number }[] }

function buildModulosSection(modulos: ModuloResumo[]): string {
  if (!modulos.length) return ''
  const linhas = modulos.map(m => {
    const aulas = m.aulas.map(a => `    - Aula ${a.ordem}: ${a.titulo}`).join('\n')
    return `  Módulo ${m.ordem} — ${m.titulo}${aulas ? '\n' + aulas : ''}`
  }).join('\n')
  return `\n\n## CONTEÚDO DA PLATAFORMA\nQuando o consultor tiver dúvida sobre um assunto, indique o módulo e a aula correta abaixo. Diga para ele acessar em "Módulos" na plataforma.\n\n${linhas}`
}

function buildSystemPrompt(nomeAssistente: string, promptExtra: string | null, argumentos: string[], modulos: ModuloResumo[] = []) {
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

  prompt += buildModulosSection(modulos)

  if (promptExtra?.trim()) {
    prompt += `\n\n## INSTRUÇÕES ESPECÍFICAS\n${promptExtra}`
  }

  return prompt
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const tenantId = ctx.tenantId ?? null

  const [config, argumentos, modulosRaw, aulasRaw] = await Promise.all([
    getConfig(tenantId, adminClient),
    getArgumentos(tenantId, adminClient),
    (() => {
      let q = adminClient.from('modulos').select('id, titulo, ordem').order('ordem')
      if (tenantId) q = q.eq('tenant_id', tenantId)
      return q
    })(),
    (() => {
      let q = adminClient.from('aulas').select('titulo, ordem, modulo_id').eq('publicado', true).order('ordem')
      if (tenantId) q = q.eq('tenant_id', tenantId)
      return q
    })(),
  ])

  const aulasData = aulasRaw.data ?? []
  const modulos: ModuloResumo[] = (modulosRaw.data ?? []).map((m: { id: string; titulo: string; ordem: number }) => ({
    titulo: m.titulo,
    ordem: m.ordem,
    aulas: aulasData
      .filter((a: { modulo_id: string; titulo: string; ordem: number }) => a.modulo_id === m.id)
      .map((a: { titulo: string; ordem: number }) => ({ titulo: a.titulo, ordem: a.ordem })),
  }))

  const nomeAssistente = config?.nome_assistente ?? 'Assistente'
  const prompt = buildSystemPrompt(nomeAssistente, config?.prompt_extra ?? null, argumentos, modulos)

  return NextResponse.json({ prompt, blocos: {
    argumentos: argumentos.length,
    modulos: modulos.length,
    aulas: aulasData.length,
    temPromptExtra: Boolean(config?.prompt_extra?.trim()),
  }})
}

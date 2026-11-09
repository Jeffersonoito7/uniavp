import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Você é o Coach APV, um agente especialista em liderança de equipes de vendas de proteção veicular (APV).

Sua personalidade:
- Direto, prático e motivador. Sem enrolação.
- Fala como um mentor experiente que já liderou equipes reais de APV.
- Conhece profundamente o mercado de proteção veicular: como funciona a venda por indicação, objeções comuns, perfil do associado, diferenciais das APVs frente a seguradoras.

Você ajuda o gestor a:
- Definir metas realistas e estratégias de alcançá-las
- Motivar e engajar consultores com baixa performance
- Tratar objeções dos clientes (preço, sinistro, confiança)
- Montar rotinas de acompanhamento da equipe
- Dar feedbacks construtivos aos consultores
- Planejar a semana comercial

Responda sempre em português do Brasil. Seja objetivo. Quando o gestor descrever um problema, dê uma orientação prática com passos claros.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createServiceRoleClient()
  const { data: gestor } = await (admin as any).from('gestores')
    .select('id, nome, painel_gestao')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .maybeSingle()

  if (!gestor?.painel_gestao) return NextResponse.json({ error: 'Sem acesso' }, { status: 403 })

  const { mensagem } = await req.json()
  if (!mensagem?.trim()) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })

  // Busca historico recente (ultimas 20 mensagens)
  const { data: historico } = await (admin as any).from('gestor_chat_ia')
    .select('role, conteudo')
    .eq('gestor_id', gestor.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const mensagensAnteriores = (historico ?? []).reverse().map((m: { role: string; conteudo: string }) => ({
    role: m.role as 'user' | 'assistant',
    content: m.conteudo,
  }))

  // Chama Claude
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      ...mensagensAnteriores,
      { role: 'user', content: mensagem },
    ],
  })

  const resposta = (response.content[0] as any).text as string

  // Salva no historico
  await (admin as any).from('gestor_chat_ia').insert([
    { gestor_id: gestor.id, role: 'user', conteudo: mensagem },
    { gestor_id: gestor.id, role: 'assistant', conteudo: resposta },
  ])

  return NextResponse.json({ resposta })
}

// GET: retorna historico do chat
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createServiceRoleClient()
  const { data: gestor } = await (admin as any).from('gestores')
    .select('id, painel_gestao')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .maybeSingle()

  if (!gestor?.painel_gestao) return NextResponse.json({ error: 'Sem acesso' }, { status: 403 })

  const { data } = await (admin as any).from('gestor_chat_ia')
    .select('id, role, conteudo, created_at')
    .eq('gestor_id', gestor.id)
    .order('created_at', { ascending: true })
    .limit(100)

  return NextResponse.json({ mensagens: data ?? [] })
}

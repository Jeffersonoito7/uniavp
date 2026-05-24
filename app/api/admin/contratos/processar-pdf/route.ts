import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const PROMPT = `Você vai analisar um contrato de representação comercial e extrair as cláusulas mais importantes que protegem a associação.

Seu objetivo é identificar e reformular os pontos críticos sobre:
- Ética e conduta
- Lealdade e exclusividade
- Proibição de venda incorreta ou promessas irregulares
- Sigilo e confidencialidade
- Rescisão e multas
- LGPD e dados pessoais
- Responsabilidades do consultor
- Qualquer outro ponto que "blinda" a associação juridicamente

Para cada cláusula extraída, crie:
- "titulo": título curto e claro (ex: "ÉTICA E CONDUTA")
- "texto": texto completo da cláusula (direto do contrato, pode adaptar levemente)
- "resumo": frase em 1ª pessoa que o consultor vai LER E ACEITAR clicando (ex: "Estou ciente que devo manter conduta ética...")

Retorne APENAS um JSON válido (sem markdown, sem explicação), no formato:
[
  {"num": 1, "titulo": "...", "texto": "...", "resumo": "..."},
  {"num": 2, "titulo": "...", "texto": "...", "resumo": "..."}
]

Extraia entre 5 e 12 cláusulas. Priorize clareza e proteção jurídica da associação.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Serviço de IA indisponível' }, { status: 503 })

  let pdfBase64: string
  let mimeType: 'application/pdf' | 'text/plain'

  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    const file = form.get('arquivo') as File | null
    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

    const buf = await file.arrayBuffer()
    pdfBase64 = Buffer.from(buf).toString('base64')
    mimeType = file.type === 'application/pdf' ? 'application/pdf' : 'text/plain'
  } else {
    const body = await req.json()
    if (!body.pdfBase64) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    pdfBase64 = body.pdfBase64
    mimeType = body.mimeType ?? 'application/pdf'
  }

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: mimeType, data: pdfBase64 },
          } as any,
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  })

  const textoResposta = message.content[0]?.type === 'text' ? message.content[0].text : ''

  // Extrai o JSON da resposta (remove possível markdown)
  const jsonMatch = textoResposta.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    return NextResponse.json({ error: 'A IA não conseguiu extrair cláusulas. Tente com outro arquivo.' }, { status: 422 })
  }

  let clausulas: unknown[]
  try {
    clausulas = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'Erro ao processar resposta da IA.' }, { status: 422 })
  }

  return NextResponse.json({ ok: true, clausulas })
}


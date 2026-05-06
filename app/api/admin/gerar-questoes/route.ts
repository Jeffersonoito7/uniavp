import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });

  const adminClient = createServiceRoleClient();
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle();
  if (!adminRecord) return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 });

  const body = await req.json();
  const { aula_id, tema, quantidade, contexto } = body;

  if (!aula_id || !tema || !quantidade) {
    return NextResponse.json({ erro: 'Campos obrigatórios: aula_id, tema, quantidade' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Gere ${quantidade} questões de múltipla escolha sobre "${tema}" para um treinamento corporativo de consultores de proteção veicular.
Contexto adicional: ${contexto || 'Nenhum contexto adicional.'}

Para cada questão retorne JSON com formato:
{
  "questoes": [
    {
      "enunciado": "...",
      "alternativas": [
        {"letra": "A", "texto": "...", "correta": false},
        {"letra": "B", "texto": "...", "correta": true},
        {"letra": "C", "texto": "...", "correta": false},
        {"letra": "D", "texto": "...", "correta": false}
      ],
      "explicacao": "..."
    }
  ]
}
Retorne APENAS o JSON, sem texto adicional.`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const conteudo = message.content[0];
  if (conteudo.type !== 'text') {
    return NextResponse.json({ erro: 'Resposta inválida da IA' }, { status: 500 });
  }

  let parsed: { questoes: any[] };
  try {
    const texto = conteudo.text.trim();
    const jsonStr = texto.startsWith('{') ? texto : texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1);
    parsed = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json({ erro: 'Falha ao parsear resposta da IA' }, { status: 500 });
  }

  const questoesGeradas = parsed.questoes ?? [];

  const { data: existentes } = await (adminClient.from('questoes') as any)
    .select('ordem').eq('aula_id', aula_id).order('ordem', { ascending: false }).limit(1);

  let proximaOrdem = (existentes?.[0]?.ordem ?? 0) + 1;

  const inserir = questoesGeradas.map((q: any) => ({
    aula_id,
    enunciado: q.enunciado,
    alternativas: q.alternativas,
    explicacao: q.explicacao ?? null,
    ordem: proximaOrdem++,
    ativa: true,
  }));

  const { error } = await (adminClient.from('questoes') as any).insert(inserir);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  return NextResponse.json({ questoes: inserir, total: inserir.length });
}

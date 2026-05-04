import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { Aula, Questao } from '@/lib/database.types';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { aluno_id, aula_id, respostas } = body as {
    aluno_id: string;
    aula_id: string;
    respostas: { questao_id: string; letra_escolhida: string }[];
  };

  if (!aluno_id || !aula_id || !respostas?.length) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const client = createServiceRoleClient();

  const { data: aula } = await (client.from('aulas') as any)
    .select('quiz_aprovacao_minima, espera_horas')
    .eq('id', aula_id).single() as { data: Pick<Aula, 'quiz_aprovacao_minima' | 'espera_horas'> | null };

  if (!aula) return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 });

  const questaoIds = respostas.map(r => r.questao_id);
  const { data: questoesRaw } = await (client.from('questoes') as any)
    .select('id, alternativas')
    .in('id', questaoIds);
  const questoes = (questoesRaw ?? []) as Pick<Questao, 'id' | 'alternativas'>[];

  if (!questoes.length) return NextResponse.json({ error: 'Questões não encontradas' }, { status: 404 });

  let acertos = 0;
  for (const resp of respostas) {
    const questao = questoes.find(q => q.id === resp.questao_id);
    if (!questao) continue;
    const correta = questao.alternativas.find(a => a.correta);
    if (correta && correta.letra === resp.letra_escolhida) acertos++;
  }

  const total = respostas.length;
  const percentual = Math.round((acertos / total) * 100);
  const aprovado = percentual >= aula.quiz_aprovacao_minima;

  let proxima_aula_liberada_em: string | null = null;
  if (aprovado) {
    if (aula.espera_horas > 0) {
      proxima_aula_liberada_em = new Date(Date.now() + aula.espera_horas * 3600 * 1000).toISOString();
    } else {
      proxima_aula_liberada_em = new Date().toISOString();
    }
  }

  const { count: tentativasAnteriores } = await (client.from('progresso') as any)
    .select('*', { count: 'exact', head: true })
    .eq('aluno_id', aluno_id)
    .eq('aula_id', aula_id);

  const tentativa_numero = (tentativasAnteriores ?? 0) + 1;

  await (client.from('progresso') as any).insert({
    aluno_id,
    aula_id,
    tentativa_numero,
    acertos,
    total_questoes: total,
    percentual,
    aprovado,
    respostas,
    proxima_aula_liberada_em,
  });

  if (aprovado) {
    const { data: trilha } = await (client.rpc as any)('obter_trilha_aluno', { p_aluno_id: aluno_id });
    if (trilha) {
      const todasConcluidas = (trilha as any[]).every(t => t.status === 'concluida' || t.aula_id === aula_id);
      if (todasConcluidas) {
        await (client.from('alunos') as any).update({ status: 'concluido' }).eq('id', aluno_id);
      }
    }
  }

  return NextResponse.json({ aprovado, acertos, total, percentual, proxima_liberada_em: proxima_aula_liberada_em });
}

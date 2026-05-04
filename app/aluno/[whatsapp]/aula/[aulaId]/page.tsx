import { notFound, redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import PlayerQuiz from './PlayerQuiz';
import type { Aluno, Aula, Questao, TrilhaItem } from '@/lib/database.types';

export default async function AulaPage({ params }: { params: Promise<{ whatsapp: string; aulaId: string }> }) {
  const { whatsapp, aulaId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/aluno/${whatsapp}/aula/${aulaId}`);

  const adminClient = createServiceRoleClient();

  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp')
    .eq('whatsapp', whatsapp).maybeSingle() as { data: Pick<Aluno, 'id' | 'nome' | 'whatsapp'> | null };
  if (!aluno) notFound();

  const { data: meuAluno } = await (adminClient.from('alunos') as any).select('whatsapp').eq('user_id', user.id).maybeSingle() as { data: { whatsapp: string } | null };
  if (meuAluno && meuAluno.whatsapp !== whatsapp) redirect(`/aluno/${meuAluno.whatsapp}`);

  const { data: aula } = await (adminClient.from('aulas') as any)
    .select('id, titulo, descricao, youtube_video_id, duracao_minutos, quiz_qtd_questoes, quiz_aprovacao_minima, espera_horas, publicado, modulo_id')
    .eq('id', aulaId).maybeSingle() as { data: Pick<Aula, 'id' | 'titulo' | 'descricao' | 'youtube_video_id' | 'duracao_minutos' | 'quiz_qtd_questoes' | 'quiz_aprovacao_minima' | 'espera_horas' | 'publicado' | 'modulo_id'> | null };
  if (!aula || !aula.publicado) notFound();

  const { data: trilhaRaw } = await (adminClient.rpc as any)('obter_trilha_aluno', { p_aluno_id: aluno.id });
  const trilha = (trilhaRaw ?? []) as TrilhaItem[];
  const itemTrilha = trilha.find(t => t.aula_id === aulaId);

  if (!itemTrilha || itemTrilha.status === 'bloqueada') {
    redirect(`/aluno/${whatsapp}`);
  }

  const { data: questoesRaw } = await (adminClient.from('questoes') as any)
    .select('id, ordem, enunciado, alternativas, explicacao')
    .eq('aula_id', aulaId)
    .eq('ativa', true)
    .order('ordem');
  const questoes = (questoesRaw ?? []) as Pick<Questao, 'id' | 'ordem' | 'enunciado' | 'alternativas' | 'explicacao'>[];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)' }}>
      <div style={{ padding: '20px 5%', borderBottom: '1px solid var(--avp-border)' }}>
        <a href={`/aluno/${whatsapp}`} style={{ color: 'var(--avp-text-dim)', textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← Voltar para trilha
        </a>
      </div>
      <PlayerQuiz
        aula={aula as any}
        questoes={questoes as any[]}
        alunoId={aluno.id}
        whatsapp={whatsapp}
        jaAssistiu={itemTrilha.status === 'concluida'}
      />
    </div>
  );
}

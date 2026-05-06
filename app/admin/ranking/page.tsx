import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import AdminLayout from '../AdminLayout';

export default async function RankingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const adminClient = createServiceRoleClient();
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle();
  if (!adminRecord) redirect('/aluno');

  const { data: alunos } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, email, status')
    .order('nome', { ascending: true });

  const { data: aulasData } = await (adminClient.from('aulas') as any)
    .select('id')
    .eq('publicado', true);

  const totalAulas = aulasData?.length ?? 0;

  const { data: progressos } = await (adminClient.from('progresso') as any)
    .select('aluno_id, aula_id')
    .eq('aprovado', true);

  const progressosPorAluno = new Map<string, Set<string>>();
  for (const p of (progressos ?? [])) {
    if (!progressosPorAluno.has(p.aluno_id)) {
      progressosPorAluno.set(p.aluno_id, new Set());
    }
    progressosPorAluno.get(p.aluno_id)!.add(p.aula_id);
  }

  const ranking = (alunos ?? []).map((aluno: any) => {
    const concluidas = progressosPorAluno.get(aluno.id)?.size ?? 0;
    const pct = totalAulas > 0 ? Math.round((concluidas / totalAulas) * 100) : 0;
    return { ...aluno, concluidas, pct };
  }).sort((a: any, b: any) => b.pct - a.pct || b.concluidas - a.concluidas);

  return (
    <AdminLayout paginaAtiva="ranking">
      <div>
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--avp-text-dim)', marginBottom: 6 }}>Administração</p>
          <h1 style={{ fontFamily: 'Inter', fontSize: 28, letterSpacing: 2, margin: 0 }}>Ranking dos Consultores</h1>
        </div>

        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--avp-border)' }}>
                {['#', 'Consultor', 'WhatsApp', 'Progresso', 'Concluídas', 'Status'].map(col => (
                  <th key={col} style={{
                    padding: '14px 16px', textAlign: 'left', fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: 1.5,
                    color: 'var(--avp-text-dim)', fontWeight: 600,
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranking.map((c: any, i: number) => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(37,40,54,0.5)' }}>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: i < 3 ? 'var(--avp-green)' : 'var(--avp-text-dim)', fontWeight: 700, width: 40 }}>
                    {i + 1}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{c.nome}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--avp-text-dim)' }}>{c.email}</p>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--avp-text-dim)' }}>{c.whatsapp}</td>
                  <td style={{ padding: '14px 16px', minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--avp-border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${c.pct}%`, background: 'var(--grad-brand)', borderRadius: 99, transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--avp-green)', fontWeight: 600, minWidth: 36, textAlign: 'right' }}>{c.pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--avp-text-dim)' }}>
                    {c.concluidas}/{totalAulas}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: c.status === 'ativo' ? 'rgba(2,161,83,0.15)' : c.status === 'concluido' ? 'rgba(51,54,135,0.2)' : 'rgba(138,143,163,0.15)',
                      color: c.status === 'ativo' ? 'var(--avp-green)' : c.status === 'concluido' ? '#6b6ef5' : 'var(--avp-text-dim)',
                    }}>
                      {c.status === 'ativo' ? 'Ativo' : c.status === 'concluido' ? 'Concluído' : c.status === 'pausado' ? 'Pausado' : 'Desligado'}
                    </span>
                  </td>
                </tr>
              ))}
              {ranking.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--avp-text-dim)', fontSize: 14 }}>
                    Nenhum consultor cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

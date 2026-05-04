import { notFound, redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import AdminLayout from '../../AdminLayout';
import QuestoesCliente from './QuestoesCliente';
import type { Aula, Questao } from '@/lib/database.types';

export default async function GerenciarQuestoesPage({ params }: { params: Promise<{ aulaId: string }> }) {
  const { aulaId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminClient = createServiceRoleClient();
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle();
  if (!adminRecord) redirect('/aluno');

  const { data: aula } = await (adminClient.from('aulas') as any).select('id, titulo, modulo_id').eq('id', aulaId).maybeSingle() as { data: Pick<Aula, 'id' | 'titulo' | 'modulo_id'> | null };
  if (!aula) notFound();

  const { data: questoesRaw } = await (adminClient.from('questoes') as any).select('*').eq('aula_id', aulaId).order('ordem');
  const questoes = (questoesRaw ?? []) as Questao[];

  return (
    <AdminLayout paginaAtiva="modulos">
      <div style={{ marginBottom: 8 }}>
        <a href={`/admin/modulos/${aula.modulo_id}`} style={{ fontSize: 13, color: 'var(--avp-text-dim)', textDecoration: 'none' }}>
          ← Aulas do módulo
        </a>
      </div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Inter', fontSize: 28, letterSpacing: 2, margin: '8px 0 4px' }}>
          Questões — {aula.titulo}
        </h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Banco de questões do quiz</p>
      </div>
      <QuestoesCliente aulaId={aulaId} questoesIniciais={questoes} />
    </AdminLayout>
  );
}

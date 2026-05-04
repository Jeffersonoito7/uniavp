import { notFound, redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import AdminLayout from '../../AdminLayout';
import AulasCliente from './AulasCliente';
import type { Modulo, Aula } from '@/lib/database.types';

export default async function GerenciarAulasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminClient = createServiceRoleClient();
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle();
  if (!adminRecord) redirect('/aluno');

  const { data: modulo } = await (adminClient.from('modulos') as any).select('id, titulo, ordem').eq('id', id).maybeSingle() as { data: Pick<Modulo, 'id' | 'titulo' | 'ordem'> | null };
  if (!modulo) notFound();

  const { data: aulasRaw } = await (adminClient.from('aulas') as any).select('*').eq('modulo_id', id).order('ordem');
  const aulas = (aulasRaw ?? []) as Aula[];

  return (
    <AdminLayout paginaAtiva="modulos">
      <div style={{ marginBottom: 8 }}>
        <a href="/admin/modulos" style={{ fontSize: 13, color: 'var(--avp-text-dim)', textDecoration: 'none' }}>
          ← Módulos
        </a>
      </div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Inter', fontSize: 32, letterSpacing: 2, margin: '8px 0 4px' }}>{modulo.titulo}</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Gerencie as aulas deste módulo</p>
      </div>
      <AulasCliente moduloId={id} aulasIniciais={aulas} />
    </AdminLayout>
  );
}

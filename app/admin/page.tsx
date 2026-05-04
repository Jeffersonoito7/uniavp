import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import AdminLayout from './AdminLayout';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminClient = createServiceRoleClient();
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle();
  if (!adminRecord) redirect('/aluno');

  const [{ count: totalAlunos }, { count: totalModulos }, { count: totalAulas }, { count: totalConcluidos }] = await Promise.all([
    (adminClient.from('alunos') as any).select('*', { count: 'exact', head: true }),
    (adminClient.from('modulos') as any).select('*', { count: 'exact', head: true }),
    (adminClient.from('aulas') as any).select('*', { count: 'exact', head: true }),
    (adminClient.from('alunos') as any).select('*', { count: 'exact', head: true }).eq('status', 'concluido'),
  ]);

  function StatCard({ label, valor, accent }: { label: string; valor: number; accent?: boolean }) {
    return (
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 22, position: 'relative', overflow: 'hidden' }}>
        {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--grad-brand)' }} />}
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--avp-text-dim)', marginBottom: 8 }}>{label}</div>
        <div style={{ fontFamily: 'Inter', fontSize: 38, lineHeight: 1 }}>{valor}</div>
      </div>
    );
  }

  return (
    <AdminLayout paginaAtiva="dashboard">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Inter', fontSize: 32, letterSpacing: 2, margin: 0 }}>Dashboard</h1>
        <p style={{ color: 'var(--avp-text-dim)', marginTop: 4, fontSize: 14 }}>Universidade Auto Vale Prevenções</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard label="Consultores" valor={totalAlunos ?? 0} />
        <StatCard label="Módulos" valor={totalModulos ?? 0} accent />
        <StatCard label="Aulas" valor={totalAulas ?? 0} />
        <StatCard label="Concluídos" valor={totalConcluidos ?? 0} accent />
      </div>
    </AdminLayout>
  );
}

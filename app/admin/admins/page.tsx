import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import AdminLayout from '../AdminLayout';
import AdminsCliente from './AdminsCliente';

export default async function AdminsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminClient = createServiceRoleClient();
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id, role').eq('user_id', user.id).eq('ativo', true).maybeSingle() as { data: { id: string; role: string } | null };
  if (!adminRecord) redirect('/aluno');

  const { data: admins } = await (adminClient.from('admins') as any)
    .select('id, nome, email, role, ativo, created_at')
    .order('created_at', { ascending: false }) as { data: any[] | null };

  return (
    <AdminLayout paginaAtiva="admins">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: 1, margin: 0 }}>Administradores</h1>
        <p style={{ color: 'var(--avp-text-dim)', marginTop: 4, fontSize: 14 }}>Gerencie quem tem acesso ao painel</p>
      </div>
      <AdminsCliente admins={admins ?? []} isSuperAdmin={adminRecord.role === 'super_admin'} />
    </AdminLayout>
  );
}

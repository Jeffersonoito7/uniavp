import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import AdminLayout from '../AdminLayout';
import ConsultoresCliente from './ConsultoresCliente';

export default async function ConsultoresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminClient = createServiceRoleClient();
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle();
  if (!adminRecord) redirect('/aluno');

  const { data: consultores } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, email, status, created_at')
    .order('created_at', { ascending: false }) as { data: any[] | null };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://uniavp.autovaleprevencoes.org.br';

  return (
    <AdminLayout paginaAtiva="consultores">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: 1, margin: 0 }}>Consultores</h1>
        <p style={{ color: 'var(--avp-text-dim)', marginTop: 4, fontSize: 14 }}>
          {consultores?.length ?? 0} consultor{(consultores?.length ?? 0) !== 1 ? 'es' : ''} cadastrado{(consultores?.length ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>
      <ConsultoresCliente consultores={consultores ?? []} appUrl={appUrl} />
    </AdminLayout>
  );
}

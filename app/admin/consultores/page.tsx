import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import AdminLayout from '../AdminLayout';

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

  return (
    <AdminLayout paginaAtiva="consultores">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: 1, margin: 0 }}>Consultores</h1>
        <p style={{ color: 'var(--avp-text-dim)', marginTop: 4, fontSize: 14 }}>
          {consultores?.length ?? 0} consultor{(consultores?.length ?? 0) !== 1 ? 'es' : ''} cadastrado{(consultores?.length ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(consultores ?? []).map((c: any) => (
          <div key={c.id} style={{
            background: 'var(--avp-card)', border: '1px solid var(--avp-border)',
            borderRadius: 10, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{c.nome}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--avp-text-dim)' }}>{c.email}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--avp-text-dim)' }}>WhatsApp: {c.whatsapp}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: c.status === 'ativo' ? 'rgba(2,161,83,0.15)' : c.status === 'concluido' ? 'rgba(51,54,135,0.2)' : 'rgba(138,143,163,0.15)',
                color: c.status === 'ativo' ? 'var(--avp-green)' : c.status === 'concluido' ? 'var(--avp-blue-bright)' : 'var(--avp-text-dim)',
              }}>
                {c.status === 'ativo' ? 'Ativo' : c.status === 'concluido' ? 'Concluído' : c.status === 'pausado' ? 'Pausado' : 'Desligado'}
              </span>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--avp-text-dim)' }}>
                {new Date(c.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        ))}

        {(consultores ?? []).length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--avp-text-dim)' }}>
            Nenhum consultor cadastrado ainda.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

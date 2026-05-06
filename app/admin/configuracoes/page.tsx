import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import AdminLayout from '@/app/admin/AdminLayout';
import { getSiteConfig } from '@/app/lib/site-config';
import ConfiguracoesCliente from './ConfiguracoesCliente';

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/configuracoes');

  const adminClient = createServiceRoleClient();
  const { data: admin } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).maybeSingle();
  if (!admin) redirect('/login');

  const config = await getSiteConfig();

  return (
    <AdminLayout paginaAtiva="configuracoes">
      <div style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', letterSpacing: 1 }}>Configurações da Marca</h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, margin: 0 }}>Personalize a identidade visual da plataforma.</p>
        </div>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32 }}>
          <ConfiguracoesCliente config={config} />
        </div>
      </div>
    </AdminLayout>
  );
}

import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import AdminLayout from '../AdminLayout';
import ModulosCliente from './ModulosCliente';

export default async function ModulosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminClient = createServiceRoleClient();
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle();
  if (!adminRecord) redirect('/aluno');

  const { data: modulos } = await (adminClient.from('modulos') as any)
    .select('id, ordem, titulo, publicado, aulas(count)')
    .order('ordem');

  return (
    <AdminLayout paginaAtiva="modulos">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Inter', fontSize: 32, letterSpacing: 2, margin: 0 }}>Módulos</h1>
          <p style={{ color: 'var(--avp-text-dim)', marginTop: 4, fontSize: 14 }}>Gerencie os módulos do curso</p>
        </div>
      </div>
      <ModulosCliente modulosIniciais={modulos ?? []} />
    </AdminLayout>
  );
}

import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const adminClient = createServiceRoleClient();
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user!.id).eq('ativo', true).maybeSingle();
  if (adminRecord) redirect('/admin');
  const { data: gestor } = await (adminClient.from('gestores') as any).select('id').eq('user_id', user!.id).eq('ativo', true).maybeSingle();
  if (gestor) redirect('/gestor');
  const { data: aluno } = await (adminClient.from('alunos') as any).select('whatsapp').eq('user_id', user!.id).maybeSingle();
  if (aluno?.whatsapp) redirect(`/aluno/${aluno.whatsapp}`);
  redirect('/login');
}

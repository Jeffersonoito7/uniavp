import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const adminClient = createServiceRoleClient();
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user!.id).eq('ativo', true).maybeSingle();
  if (adminRecord) redirect('/admin');
  redirect('/aluno');
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: isAdmin } = await supabase.rpc('is_admin', { check_user_id: user.id });
  if (isAdmin) redirect('/admin');
  redirect('/aluno');
}

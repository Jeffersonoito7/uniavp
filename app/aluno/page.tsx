import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';

export default async function AlunoIndexPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const adminClient = createServiceRoleClient();
  const { data: aluno } = await (adminClient.from('alunos') as any).select('whatsapp').eq('user_id', user.id).maybeSingle() as { data: { whatsapp: string } | null };
  if (!aluno) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h1>Aluno não cadastrado</h1>
        <p style={{ color: 'var(--avp-text-dim)', marginTop: 12 }}>Sua conta existe mas não há aluno vinculado.</p>
      </div>
    );
  }
  redirect(`/aluno/${aluno.whatsapp}`);
}

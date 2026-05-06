import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const adminClient = createServiceRoleClient();
  const { data: admin } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).maybeSingle();
  if (!admin) return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 });

  const pares: { chave: string; valor: any }[] = await request.json();

  for (const par of pares) {
    await (adminClient.from('configuracoes') as any).upsert({
      chave: par.chave,
      valor: JSON.stringify(par.valor),
    }, { onConflict: 'chave' });
  }

  return NextResponse.json({ ok: true });
}

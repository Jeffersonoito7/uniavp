import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';

async function verificarAdmin(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adminClient = createServiceRoleClient();
  const { data } = await (adminClient.from('admins') as any).select('id, role').eq('user_id', user.id).eq('ativo', true).maybeSingle();
  return data;
}

export async function POST(request: Request) {
  try {
    const admin = await verificarAdmin(request);
    if (!admin || admin.role !== 'super_admin') return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 });

    const { nome, email, senha, role } = await request.json();
    if (!nome || !email || !senha) return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 });

    const adminClient = createServiceRoleClient();
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email, password: senha, email_confirm: true,
      user_metadata: { nome },
    });
    if (authError || !authData.user) return NextResponse.json({ erro: authError?.message || 'Erro ao criar usuário' }, { status: 400 });

    const { data: novoAdmin, error: adminError } = await (adminClient.from('admins') as any).insert({
      user_id: authData.user.id, nome, email, role: role || 'admin', ativo: true,
    }).select().single();

    if (adminError) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ erro: adminError.message }, { status: 400 });
    }

    return NextResponse.json({ admin: novoAdmin });
  } catch (err: any) {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await verificarAdmin(request);
    if (!admin || admin.role !== 'super_admin') return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 });

    const { id, ativo } = await request.json();
    const adminClient = createServiceRoleClient();
    await (adminClient.from('admins') as any).update({ ativo }).eq('id', id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

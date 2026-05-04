import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';

async function verificarAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adminClient = createServiceRoleClient();
  const { data } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle();
  return data ? adminClient : null;
}

export async function GET() {
  const client = await verificarAdmin();
  if (!client) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { data, error } = await (client.from('modulos') as any)
    .select('id, ordem, titulo, descricao, capa_url, publicado, aulas(count)')
    .order('ordem');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const client = await verificarAdmin();
  if (!client) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const { data, error } = await (client.from('modulos') as any).insert({
    titulo: body.titulo,
    descricao: body.descricao ?? null,
    ordem: body.ordem ?? 1,
    publicado: body.publicado ?? false,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const client = await verificarAdmin();
  if (!client) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const { id, ...campos } = body;
  const { data, error } = await (client.from('modulos') as any).update(campos).eq('id', id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const client = await verificarAdmin();
  if (!client) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const { error } = await (client.from('modulos') as any).delete().eq('id', body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

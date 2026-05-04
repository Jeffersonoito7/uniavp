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

export async function GET(req: NextRequest) {
  const client = await verificarAdmin();
  if (!client) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const aulaId = req.nextUrl.searchParams.get('aula_id');
  if (!aulaId) return NextResponse.json({ error: 'aula_id obrigatório' }, { status: 400 });

  const { data, error } = await (client.from('questoes') as any)
    .select('*')
    .eq('aula_id', aulaId)
    .order('ordem');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const client = await verificarAdmin();
  if (!client) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const { data, error } = await (client.from('questoes') as any).insert({
    aula_id: body.aula_id,
    ordem: body.ordem ?? 1,
    enunciado: body.enunciado,
    alternativas: body.alternativas,
    explicacao: body.explicacao ?? null,
    ativa: body.ativa ?? true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const client = await verificarAdmin();
  if (!client) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const { id, ...campos } = body;
  const { data, error } = await (client.from('questoes') as any).update(campos).eq('id', id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const client = await verificarAdmin();
  if (!client) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const { error } = await (client.from('questoes') as any).delete().eq('id', body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

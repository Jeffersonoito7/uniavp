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

  const moduloId = req.nextUrl.searchParams.get('modulo_id');
  if (!moduloId) return NextResponse.json({ error: 'modulo_id obrigatório' }, { status: 400 });

  const { data, error } = await (client.from('aulas') as any)
    .select('*')
    .eq('modulo_id', moduloId)
    .order('ordem');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const client = await verificarAdmin();
  if (!client) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const { data, error } = await (client.from('aulas') as any).insert({
    modulo_id: body.modulo_id,
    titulo: body.titulo,
    descricao: body.descricao ?? null,
    youtube_video_id: body.youtube_video_id ?? null,
    duracao_minutos: body.duracao_minutos ?? null,
    ordem: body.ordem ?? 1,
    quiz_qtd_questoes: body.quiz_qtd_questoes ?? 5,
    quiz_aprovacao_minima: body.quiz_aprovacao_minima ?? 70,
    espera_horas: body.espera_horas ?? 24,
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
  const { data, error } = await (client.from('aulas') as any).update(campos).eq('id', id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const client = await verificarAdmin();
  if (!client) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const { error } = await (client.from('aulas') as any).delete().eq('id', body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

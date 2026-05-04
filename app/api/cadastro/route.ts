import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase-server';

const schema = z.object({
  nome: z.string().min(3).max(100),
  whatsapp: z.string().regex(/^\d{10,13}$/, 'WhatsApp inválido (apenas números)'),
  email: z.string().email(),
  senha: z.string().min(6),
  indicadorId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dados = schema.parse(body);
    const supabase = createServiceRoleClient();

    const { data: existente } = await supabase.from('alunos').select('id').eq('whatsapp', dados.whatsapp).maybeSingle();
    if (existente) return NextResponse.json({ erro: 'WhatsApp já cadastrado' }, { status: 409 });

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: dados.email, password: dados.senha, email_confirm: true,
      user_metadata: { nome: dados.nome, whatsapp: dados.whatsapp },
    });
    if (authError || !authData.user) return NextResponse.json({ erro: authError?.message || 'Falha ao criar usuário' }, { status: 400 });

    const { error: alunoError } = await supabase.from('alunos').insert({
      user_id: authData.user.id, nome: dados.nome, whatsapp: dados.whatsapp,
      email: dados.email, indicador_id: dados.indicadorId, status: 'ativo',
    });
    if (alunoError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ erro: alunoError.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, whatsapp: dados.whatsapp });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ erro: err.errors[0]?.message || 'Dados inválidos' }, { status: 400 });
    console.error('Erro:', err);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

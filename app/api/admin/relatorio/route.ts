import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });

  const adminClient = createServiceRoleClient();
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle();
  if (!adminRecord) return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 });

  const { data: alunos } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, email, status, created_at')
    .order('nome', { ascending: true });

  const { data: aulasData } = await (adminClient.from('aulas') as any)
    .select('id').eq('publicado', true);

  const totalAulas = aulasData?.length ?? 0;

  const { data: progressos } = await (adminClient.from('progresso') as any)
    .select('aluno_id, aula_id').eq('aprovado', true);

  const progressosPorAluno = new Map<string, Set<string>>();
  for (const p of (progressos ?? [])) {
    if (!progressosPorAluno.has(p.aluno_id)) {
      progressosPorAluno.set(p.aluno_id, new Set());
    }
    progressosPorAluno.get(p.aluno_id)!.add(p.aula_id);
  }

  const linhas = (alunos ?? []).map((aluno: any) => {
    const concluidas = progressosPorAluno.get(aluno.id)?.size ?? 0;
    const pct = totalAulas > 0 ? Math.round((concluidas / totalAulas) * 100) : 0;
    const dataCadastro = new Date(aluno.created_at).toLocaleDateString('pt-BR');
    const statusLabel =
      aluno.status === 'ativo' ? 'Ativo' :
      aluno.status === 'concluido' ? 'Concluído' :
      aluno.status === 'pausado' ? 'Pausado' : 'Desligado';
    return {
      'Nome': aluno.nome,
      'WhatsApp': aluno.whatsapp,
      'Email': aluno.email,
      'Status': statusLabel,
      'Aulas Concluídas': `${concluidas}/${totalAulas}`,
      '% Progresso': `${pct}%`,
      'Data Cadastro': dataCadastro,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(linhas);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Consultores');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="relatorio-consultores.xlsx"',
    },
  });
}

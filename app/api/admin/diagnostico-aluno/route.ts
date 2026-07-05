import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/admin/diagnostico-aluno?whatsapp=5511999999999
// Retorna o estado completo do aluno: progresso, bloqueios, motivos
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await adminClient.from('admins')
    .select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const whatsapp = searchParams.get('whatsapp')?.replace(/\D/g, '')
  if (!whatsapp) return NextResponse.json({ error: 'whatsapp obrigatório' }, { status: 400 })

  let q = adminClient.from('alunos').select('id, nome, whatsapp, tenant_id').eq('whatsapp', whatsapp)
  if (adminRecord.tenant_id) q = q.eq('tenant_id', adminRecord.tenant_id)
  const { data: aluno } = await q.maybeSingle()
  if (!aluno) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })

  // Busca todos os registros de progresso deste aluno
  const { data: progressos } = await adminClient.from('progresso')
    .select('id, aula_id, aprovado, pendente_liberacao, proxima_aula_liberada_em, created_at, percentual, aula:aulas(titulo, espera_horas, liberacao_modo, modulo:modulos(titulo))')
    .eq('aluno_id', aluno.id)
    .order('created_at', { ascending: false })

  const agora = new Date().toISOString()

  const diagnostico = (progressos ?? []).map(p => {
    const aula = p.aula as { titulo: string; espera_horas: number | null; liberacao_modo: string | null; modulo: { titulo: string } | null } | null
    let motivo_bloqueio: string | null = null

    if (p.aprovado && p.pendente_liberacao) {
      motivo_bloqueio = 'PENDENTE_MANUAL: aprovado mas aguardando liberacao manual do admin/gestor'
    } else if (p.aprovado && p.proxima_aula_liberada_em && p.proxima_aula_liberada_em > agora) {
      motivo_bloqueio = `AGUARDANDO_TEMPO: proximo desbloqueio em ${p.proxima_aula_liberada_em}`
    } else if (p.aprovado && !p.proxima_aula_liberada_em && !p.pendente_liberacao) {
      motivo_bloqueio = null // sem bloqueio neste registro
    } else if (!p.aprovado) {
      motivo_bloqueio = `REPROVADO: ${p.percentual}% (tentativa nao aprovada)`
    }

    return {
      progresso_id: p.id,
      aula_titulo: aula?.titulo ?? p.aula_id,
      modulo_titulo: aula?.modulo?.titulo ?? null,
      espera_horas: aula?.espera_horas ?? null,
      liberacao_modo: aula?.liberacao_modo ?? null,
      aprovado: p.aprovado,
      percentual: p.percentual,
      pendente_liberacao: p.pendente_liberacao,
      proxima_aula_liberada_em: p.proxima_aula_liberada_em,
      created_at: p.created_at,
      motivo_bloqueio,
    }
  })

  // Identifica o registro que está causando o bloqueio atual (ultimo aprovado com bloqueio ativo)
  const bloqueio_ativo = diagnostico.find(d =>
    d.motivo_bloqueio?.startsWith('AGUARDANDO_TEMPO') || d.motivo_bloqueio?.startsWith('PENDENTE_MANUAL')
  ) ?? null

  return NextResponse.json({
    aluno: { id: aluno.id, nome: aluno.nome, whatsapp: aluno.whatsapp },
    bloqueio_ativo,
    historico: diagnostico,
  })
}

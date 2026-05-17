import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (token !== 'debug2025') return NextResponse.json({ erro: 'token inválido' }, { status: 401 })

  const adminClient = createServiceRoleClient()

  const whatsapp = req.nextUrl.searchParams.get('whatsapp') ?? ''
  const aulaId = req.nextUrl.searchParams.get('aulaId') ?? ''

  // 1. Busca aluno por whatsapp (tenta com e sem 55)
  const wppLimpo = whatsapp.replace(/\D/g, '')
  const wppSem55 = wppLimpo.startsWith('55') ? wppLimpo.slice(2) : wppLimpo
  const { data: alunos } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, user_id')
    .or(`whatsapp.eq.${wppLimpo},whatsapp.eq.${wppSem55}`)
  const aluno = alunos?.[0] ?? null
  const alunoErr = null

  // 2. Busca aula
  const { data: aula, error: aulaErr } = await (adminClient.from('aulas') as any)
    .select('*, modulo:modulos(titulo), bloquear_avancar').eq('id', aulaId).single()

  // 3. Busca aula simples (sem join)
  const { data: aulaSemJoin, error: aulaSemJoinErr } = await (adminClient.from('aulas') as any)
    .select('id, titulo, publicado, modulo_id').eq('id', aulaId).maybeSingle()

  // 4. RPC trilha
  let trilhaStatus = null
  let trilhaRawLen = 0
  if (aluno?.id) {
    const { data: trilhaRaw } = await (adminClient as any)
      .rpc('obter_trilha_aluno', { p_aluno_id: aluno.id })
    trilhaRawLen = (trilhaRaw ?? []).length
    trilhaStatus = ((trilhaRaw ?? []) as any[]).find((t: any) => t.aula_id === aulaId)
  }

  // 5. Verifica módulo
  const { data: moduloPerm } = aulaSemJoin?.modulo_id
    ? await (adminClient.from('modulos') as any).select('perfis_permitidos').eq('id', aulaSemJoin.modulo_id).maybeSingle()
    : { data: null }

  return NextResponse.json({
    aluno: aluno ? { id: aluno.id, nome: aluno.nome, whatsapp: aluno.whatsapp } : null,
    aluno_err: alunoErr?.message,
    aula_com_join: aula ? { id: aula.id, titulo: aula.titulo, publicado: aula.publicado, bloquear_avancar: (aula as any).bloquear_avancar } : null,
    aula_join_err: aulaErr?.message,
    aula_simples: aulaSemJoin,
    aula_simples_err: aulaSemJoinErr?.message,
    trilha_total_aulas: trilhaRawLen,
    trilha_status_desta_aula: trilhaStatus,
    modulo_perfis_permitidos: moduloPerm?.perfis_permitidos,
    checks: {
      aluno_encontrado: !!aluno,
      aula_encontrada_com_join: !!aula,
      aula_publicada: aula?.publicado,
      trilha_status: trilhaStatus?.status ?? 'não encontrada na trilha',
      modulo_apenas_pro: moduloPerm ? (!moduloPerm.perfis_permitidos?.includes('consultor') && moduloPerm.perfis_permitidos?.includes('gestor')) : null,
    }
  })
}

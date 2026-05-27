import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaTenant } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'
import { getMensagem } from '@/lib/mensagem'

export const dynamic = 'force-dynamic'

// Roda diariamente às 9h — envia mensagens de boas-vindas nos dias 1, 3, 7
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createServiceRoleClient()
  const agora = new Date()
  let enviados = 0

  const { data: alunos } = await admin.from('alunos')
    .select('id, nome, whatsapp, gestor_nome, created_at, tenant_id')
    .eq('status', 'ativo')

  const instanciaCache = new Map<string, string | null>()
  async function instanciaDo(tid: string | null) {
    const key = tid ?? ''
    if (!instanciaCache.has(key)) instanciaCache.set(key, await getInstanciaTenant(tid, admin))
    return instanciaCache.get(key) ?? null
  }

  for (const a of alunos ?? []) {
    const dias = Math.floor((agora.getTime() - new Date(a.created_at!).getTime()) / 86400000)

    const appUrl = await getAppUrl(a.tenant_id)
    const instancia = await instanciaDo(a.tenant_id)
    const vars = { alunoNome: a.nome, gestorNome: a.gestor_nome ?? '', whatsapp: a.whatsapp, appUrl }

    if (dias === 1) {
      await enviarWhatsApp(a.whatsapp,
        await getMensagem('sequencia_dia1', vars, admin, a.tenant_id),
        instancia)
      enviados++
    }

    if (dias === 3) {
      const { data: prog } = await admin.from('progresso').select('id').eq('aluno_id', a.id).limit(1).maybeSingle()
      if (!prog) {
        await enviarWhatsApp(a.whatsapp,
          await getMensagem('sequencia_dia3_sem_aula', vars, admin, a.tenant_id),
          instancia)
        enviados++
      }
    }

    if (dias === 7) {
      const { count } = await admin.from('progresso').select('id', { count: 'exact', head: true }).eq('aluno_id', a.id).eq('aprovado', true)
      if ((count ?? 0) === 0) {
        await enviarWhatsApp(a.whatsapp,
          await getMensagem('sequencia_dia7_sem_aula', vars, admin, a.tenant_id),
          instancia)
        enviados++
      }
    }
  }

  return NextResponse.json({ ok: true, enviados })
}

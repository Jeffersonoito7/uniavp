import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaTenant } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'
import { alertarDiscord } from '@/lib/discord'
import { getMensagem } from '@/lib/mensagem'

export const dynamic = 'force-dynamic'

// Roda diariamente — avisa consultor que aula vai expirar em 7 dias
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
  const admin = createServiceRoleClient()
  const appUrl = await getAppUrl()
  const agora = new Date()
  let avisos = 0

  const instanciaCache = new Map<string, string | null>()
  async function instanciaDo(tenantId: string | null) {
    const key = tenantId ?? ''
    if (!instanciaCache.has(key)) instanciaCache.set(key, await getInstanciaTenant(tenantId, admin))
    return instanciaCache.get(key) ?? null
  }

  type ProgressoRow = {
    id: string; aluno_id: string; aula_id: string; created_at: string | null
    aluno: { nome: string; whatsapp: string; tenant_id: string | null } | null
    aula: { titulo: string; validade_meses: number | null } | null
  }

  const { data: progressos } = await admin.from('progresso')
    .select('id, aluno_id, aula_id, created_at, aluno:alunos(nome, whatsapp, tenant_id), aula:aulas(titulo, validade_meses)')
    .eq('aprovado', true)
    .not('aula.validade_meses', 'is', null) as { data: ProgressoRow[] | null }

  for (const p of progressos ?? []) {
    if (!p.aula?.validade_meses || !p.aluno?.whatsapp) continue
    const expira = new Date(p.created_at!)
    expira.setMonth(expira.getMonth() + p.aula.validade_meses)
    const diasParaExpirar = Math.ceil((expira.getTime() - agora.getTime()) / 86400000)
    const tenantId = p.aluno.tenant_id ?? null
    const instancia = await instanciaDo(tenantId)
    const vars = { alunoNome: p.aluno.nome, aulaTitle: p.aula.titulo, appUrl }

    if (diasParaExpirar === 7) {
      await enviarWhatsApp(p.aluno.whatsapp,
        await getMensagem('validade_expira_7dias', vars, admin, tenantId),
        instancia)
      avisos++
    }
    if (diasParaExpirar === 1) {
      await enviarWhatsApp(p.aluno.whatsapp,
        await getMensagem('validade_expira_amanha', vars, admin, tenantId),
        instancia)
      avisos++
    }
  }

  return NextResponse.json({ ok: true, avisos })
  } catch (e: any) {
    await alertarDiscord('critico', 'Cron validade falhou', e?.message ?? String(e))
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaGestorPorNome, getInstanciaTenant } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'
import { getSiteConfig } from '@/lib/site-config'
import { alertarDiscord } from '@/lib/discord'
import { getMensagem } from '@/lib/mensagem'
import { jaEnviouHoje, registrarEnvio } from '@/lib/mensagens-log'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DIAS_ALERTA = [3, 7, 15]

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const adminClient = createServiceRoleClient()
    const agora = new Date()
    const appUrl = await getAppUrl()
    const siteConfig = await getSiteConfig()
    const nomePlataforma = siteConfig.nome || 'Universidade'
    let notificacoes = 0
    let pulados = 0

    const instanciaCache = new Map<string, string | null>()
    async function instanciaDo(tenantId: string | null) {
      const key = tenantId ?? ''
      if (!instanciaCache.has(key)) instanciaCache.set(key, await getInstanciaTenant(tenantId, adminClient))
      return instanciaCache.get(key) ?? null
    }

    const { data: alunos } = await adminClient.from('alunos')
      .select('id, nome, whatsapp, gestor_nome, gestor_whatsapp, status, created_at, tenant_id')
      .eq('status', 'ativo')

    for (const aluno of alunos ?? []) {
      const { data: ultimoProgresso } = await adminClient.from('progresso')
        .select('created_at')
        .eq('aluno_id', aluno.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const dataRef = ultimoProgresso
        ? new Date(ultimoProgresso.created_at ?? agora)
        : new Date(aluno.created_at ?? agora)

      const dias = Math.floor((agora.getTime() - dataRef.getTime()) / 86400000)
      if (!DIAS_ALERTA.includes(dias)) continue

      const instancia = await instanciaDo(aluno.tenant_id ?? null)
      const wppFree = aluno.whatsapp?.replace(/\D/g, '')
      const wppLink = wppFree ? `https://wa.me/55${wppFree}` : ''
      const vars = { alunoNome: aluno.nome, nomePlataforma, appUrl, whatsapp: aluno.whatsapp, dias: String(dias), wppLink }

      if (aluno.whatsapp) {
        const chaveAluno = dias === 3 ? 'inatividade_aluno_3dias' : dias === 7 ? 'inatividade_aluno_7dias' : 'inatividade_aluno_ndias'
        if (await jaEnviouHoje(aluno.whatsapp, chaveAluno, adminClient)) {
          pulados++
        } else {
          const ok = await enviarWhatsApp(aluno.whatsapp, await getMensagem(chaveAluno, vars, adminClient, aluno.tenant_id ?? null), instancia)
          if (ok) { await registrarEnvio(aluno.whatsapp, chaveAluno, aluno.tenant_id ?? null, adminClient); notificacoes++ }
        }
      }

      if (aluno.gestor_whatsapp) {
        const instanciaGestor = await getInstanciaGestorPorNome(aluno.gestor_nome ?? '', adminClient, aluno.tenant_id ?? undefined)
        const chaveGestor = dias === 3 ? 'inatividade_gestor_3dias' : dias === 7 ? 'inatividade_gestor_7dias' : 'inatividade_gestor_ndias'
        if (await jaEnviouHoje(aluno.gestor_whatsapp, chaveGestor, adminClient)) {
          pulados++
        } else {
          const ok = await enviarWhatsApp(aluno.gestor_whatsapp, await getMensagem(chaveGestor, { ...vars, gestorNome: aluno.gestor_nome ?? 'PRO' }, adminClient, aluno.tenant_id ?? null), instanciaGestor)
          if (ok) { await registrarEnvio(aluno.gestor_whatsapp, chaveGestor, aluno.tenant_id ?? null, adminClient); notificacoes++ }
        }
      }
    }

    return NextResponse.json({ ok: true, notificacoes, pulados, alunos_verificados: alunos?.length ?? 0 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    await alertarDiscord('critico', 'Cron inatividade falhou', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaTenant } from '@/lib/whatsapp'
import { alertarDiscord } from '@/lib/discord'
import { getMensagem } from '@/lib/mensagem'
import { captureException } from '@/lib/monitor'

const aulasTable = (client: ReturnType<typeof createServiceRoleClient>) => client.from('aulas_ao_vivo')

export const dynamic = 'force-dynamic'

// Envia em lotes paralelos com pausa entre lotes para não sobrecarregar a API
async function enviarEmLotes(
  numeros: string[],
  msg: string,
  instancia: string | null,
): Promise<{ enviados: number; erros: number }> {
  const LOTE = 10
  const PAUSA_MS = 500
  let enviados = 0
  let erros = 0

  for (let i = 0; i < numeros.length; i += LOTE) {
    const lote = numeros.slice(i, i + LOTE)
    const resultados = await Promise.allSettled(
      lote.map(wpp => enviarWhatsApp(wpp, msg, instancia))
    )
    for (const r of resultados) {
      if (r.status === 'fulfilled') enviados++
      else erros++
    }
    if (i + LOTE < numeros.length) {
      await new Promise(r => setTimeout(r, PAUSA_MS))
    }
  }

  return { enviados, erros }
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const agora = new Date()
  const em1h = new Date(agora.getTime() + 60 * 60 * 1000)
  const em90min = new Date(agora.getTime() + 90 * 60 * 1000)

  const instanciaCache = new Map<string, string | null>()
  async function instanciaDo(tenantId: string | null) {
    const key = tenantId ?? ''
    if (!instanciaCache.has(key)) instanciaCache.set(key, await getInstanciaTenant(tenantId, adminClient))
    return instanciaCache.get(key) ?? null
  }

  const { data: aulas } = await aulasTable(adminClient)
    .select('*')
    .gte('data_hora', em1h.toISOString())
    .lte('data_hora', em90min.toISOString())
    .eq('lembrete_enviado', false)

  if (!aulas?.length) return NextResponse.json({ ok: true, enviados: 0 })

  let totalEnviados = 0
  let totalErros = 0

  for (const aula of aulas) {
    const dataHora = new Date(aula.data_hora).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    const plataformaNome = aula.plataforma === 'zoom' ? 'Zoom' : 'Google Meet'
    const tenantId = aula.gestor_id
      ? ((await adminClient.from('gestores').select('tenant_id').eq('id', aula.gestor_id).maybeSingle())?.data?.tenant_id ?? null)
      : null
    const vars = {
      titulo: aula.titulo,
      descricao: aula.descricao ? `📝 ${aula.descricao}\n` : '',
      dataHora,
      duracao: String(aula.duracao_minutos),
      plataforma: plataformaNome,
      link: aula.link,
      presenca: aula.obrigatoria ? '⚠️ Presença *obrigatória*.' : 'Sua participação é muito bem-vinda!',
    }
    const msg = await getMensagem('lembrete_ao_vivo', vars, adminClient, tenantId)

    try {
      if (!aula.gestor_id) {
        const instancia = await instanciaDo(null)
        const { data: alunos } = await adminClient.from('alunos').select('whatsapp').eq('status', 'ativo')
        const numeros = (alunos ?? []).map(a => a.whatsapp)
        const resultado = await enviarEmLotes(numeros, msg, instancia)
        totalEnviados += resultado.enviados
        totalErros += resultado.erros
      } else {
        const { data: gestor } = await adminClient
          .from('gestores')
          .select('whatsapp, whatsapp_instancia, tenant_id')
          .eq('id', aula.gestor_id)
          .maybeSingle()

        if (gestor?.whatsapp) {
          const instancia = gestor.whatsapp_instancia ?? await instanciaDo(gestor.tenant_id ?? null)
          const { data: alunos } = await adminClient
            .from('alunos')
            .select('whatsapp')
            .eq('gestor_whatsapp', gestor.whatsapp)
            .eq('status', 'ativo')
          const numeros = (alunos ?? []).map(a => a.whatsapp)
          const resultado = await enviarEmLotes(numeros, msg, instancia)
          totalEnviados += resultado.enviados
          totalErros += resultado.erros
        }
      }
      await aulasTable(adminClient).update({ lembrete_enviado: true }).eq('id', aula.id)
    } catch (e) {
      captureException(e, { endpoint: 'cron/lembretes-ao-vivo', extra: { aulaId: aula.id } })
      totalErros++
    }
  }

  if (totalErros > 0) {
    await alertarDiscord('aviso', `${totalErros} erro(s) ao enviar lembretes de aula ao vivo`, `${totalEnviados} enviados com sucesso, ${totalErros} falharam.`)
  }

  return NextResponse.json({ ok: true, enviados: totalEnviados, erros: totalErros, aulas: aulas.length })
}

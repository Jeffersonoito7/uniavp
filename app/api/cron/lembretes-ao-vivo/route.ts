import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaTenant } from '@/lib/whatsapp'
import { alertarDiscord } from '@/lib/discord'

const aulasTable = (client: ReturnType<typeof createServiceRoleClient>) => client.from('aulas_ao_vivo')

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

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

  // Aulas que começam entre 1h e 1h30 a partir de agora e ainda não enviaram lembrete
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
    const icone = aula.plataforma === 'zoom' ? '🔵' : '🟢'
    const plataformaNome = aula.plataforma === 'zoom' ? 'Zoom' : 'Google Meet'

    const msg = [
      `${icone} *Lembrete: Aula ao Vivo em 1 hora!*`,
      ``,
      `📚 *${aula.titulo}*`,
      aula.descricao ? `📝 ${aula.descricao}` : '',
      ``,
      `🕐 *Horário:* ${dataHora}`,
      `⏱️ *Duração:* ${aula.duracao_minutos} minutos`,
      `📺 *Plataforma:* ${plataformaNome}`,
      ``,
      `🔗 *Acesse agora:*`,
      aula.link,
      ``,
      `${aula.obrigatoria ? '⚠️ Presença *obrigatória*.' : 'Sua participação é muito bem-vinda!'}`,
    ].filter(Boolean).join('\n')

    // Admin: envia para todos os alunos ativos (aula global, sem tenant isolado)
    if (!aula.gestor_id) {
      const instancia = await instanciaDo(null)
      const { data: alunos } = await adminClient.from('alunos').select('whatsapp').eq('status', 'ativo')

      for (const aluno of alunos ?? []) {
        try {
          await enviarWhatsApp(aluno.whatsapp, msg, instancia)
          totalEnviados++
        } catch (e) {
          totalErros++
          console.error('[lembretes-ao-vivo] Falha ao enviar para', aluno.whatsapp, e)
        }
        await new Promise(r => setTimeout(r, 300))
      }
    } else {
      // Gestor: envia só para os consultores deste gestor
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

        for (const aluno of alunos ?? []) {
          try {
            await enviarWhatsApp(aluno.whatsapp, msg, instancia)
            totalEnviados++
          } catch (e) {
            totalErros++
            console.error('[lembretes-ao-vivo] Falha ao enviar para', aluno.whatsapp, e)
          }
          await new Promise(r => setTimeout(r, 300))
        }
      }
    }

    await aulasTable(adminClient).update({ lembrete_enviado: true }).eq('id', aula.id)
  }

  if (totalErros > 0) {
    await alertarDiscord('aviso', `${totalErros} erro(s) ao enviar lembretes de aula ao vivo`, `${totalEnviados} enviados com sucesso, ${totalErros} falharam.`)
  }

  return NextResponse.json({ ok: true, enviados: totalEnviados, erros: totalErros, aulas: aulas.length })
}

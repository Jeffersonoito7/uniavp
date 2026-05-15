import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaGestorPorNome } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any).select('id').eq('user_id', user.id).maybeSingle()
  if (!aluno) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })

  const body = await req.json()
  const { aula_id, respostas: respostasEnviadas, pular } = body

  const { data: aula } = await (adminClient.from('aulas') as any)
    .select('id, quiz_qtd_questoes, quiz_aprovacao_minima, espera_horas, modulo_id, liberacao_modo, quiz_tipo')
    .eq('id', aula_id)
    .single()
  if (!aula) return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })

  // Quiz indicativo ou sim_nao — aluno escolheu pular ou respondeu sim/nao
  if (pular && (aula.quiz_tipo === 'indicativo' || aula.quiz_tipo === 'sim_nao')) {
    const liberada_em = new Date(Date.now() + (aula.espera_horas ?? 0) * 3600000).toISOString()
    await (adminClient.from('progresso') as any).insert({
      aluno_id: aluno.id, aula_id,
      tentativa_numero: 1, acertos: 0, total_questoes: 0,
      percentual: 0, aprovado: true, respostas: {},
      proxima_aula_liberada_em: liberada_em, pendente_liberacao: false,
    })
    await (adminClient.from('aluno_pontos') as any).insert({
      aluno_id: aluno.id, quantidade: 5, motivo: `Quiz indicativo visto - aula ${aula_id}`,
    })
    return NextResponse.json({ ok: true, pulado: true, aprovado: true })
  }

  const { data: questoes } = await (adminClient.from('questoes') as any)
    .select('id, alternativas')
    .eq('aula_id', aula_id)
    .eq('ativa', true)

  if (!questoes || questoes.length === 0) return NextResponse.json({ error: 'Sem questões' }, { status: 400 })

  let acertos = 0
  for (const q of questoes) {
    const correta = (q.alternativas as { correta?: boolean; texto: string }[]).findIndex(a => a.correta)
    if (respostasEnviadas[q.id] === correta) acertos++
  }
  const total = questoes.length
  const percentual = Math.round((acertos / total) * 100)
  const aprovado = percentual >= aula.quiz_aprovacao_minima

  const { data: tentativaAnterior } = await (adminClient.from('progresso') as any)
    .select('tentativa_numero')
    .eq('aluno_id', aluno.id)
    .eq('aula_id', aula_id)
    .order('tentativa_numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  const tentativa_numero = (tentativaAnterior?.tentativa_numero ?? 0) + 1
  const modo = (aula.liberacao_modo ?? 'automatico') as 'automatico' | 'manual_gestor' | 'manual_admin'
  const pendente_liberacao = aprovado && modo !== 'automatico'
  const proxima_aula_liberada_em = aprovado && modo === 'automatico'
    ? new Date(Date.now() + aula.espera_horas * 3600000).toISOString()
    : null

  await (adminClient.from('progresso') as any).insert({
    aluno_id: aluno.id,
    aula_id,
    tentativa_numero,
    acertos,
    total_questoes: total,
    percentual,
    aprovado,
    respostas: respostasEnviadas,
    proxima_aula_liberada_em,
    pendente_liberacao,
  })

  // Notifica gestor/admin sobre liberação pendente
  if (pendente_liberacao) {
    const { data: alunoInfo } = await (adminClient.from('alunos') as any)
      .select('nome, gestor_nome, gestor_whatsapp').eq('id', aluno.id).maybeSingle()
    const { data: aulaInfo } = await (adminClient.from('aulas') as any)
      .select('titulo').eq('id', aula_id).maybeSingle()
    if (modo === 'manual_gestor' && alunoInfo?.gestor_whatsapp) {
      const { enviarWhatsApp, getInstanciaGestorPorNome } = await import('@/lib/whatsapp')
      const inst = await getInstanciaGestorPorNome(alunoInfo.gestor_nome, adminClient)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      await enviarWhatsApp(
        alunoInfo.gestor_whatsapp,
        `📋 *${alunoInfo.nome}* foi aprovado na aula *${aulaInfo?.titulo}* e está aguardando sua liberação para continuar.\n\nAcesse o painel: ${appUrl}/gestor`,
        inst
      )
    }
    return NextResponse.json({ ok: true, acertos, total, percentual, aprovado, pendente_liberacao: true, modo })
  }

  if (aprovado) {
    await (adminClient.from('aluno_pontos') as any).insert({
      aluno_id: aluno.id,
      quantidade: 10,
      motivo: `Quiz aprovado - aula ${aula_id}`,
    })

    // ── Streak de estudo ──────────────────────────────────────────
    const hojeStr = new Date().toISOString().split('T')[0]
    const ontemStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const { data: streakInfo } = await (adminClient.from('alunos') as any)
      .select('streak_atual, maior_streak, ultimo_estudo_em').eq('id', aluno.id).maybeSingle()
    if (streakInfo !== null) {
      let novoStreak = 1
      if (streakInfo.ultimo_estudo_em === hojeStr) {
        novoStreak = streakInfo.streak_atual || 1 // já estudou hoje
      } else if (streakInfo.ultimo_estudo_em === ontemStr) {
        novoStreak = (streakInfo.streak_atual || 0) + 1 // dia consecutivo
      }
      const novoMaior = Math.max(novoStreak, streakInfo.maior_streak || 0)
      await (adminClient.from('alunos') as any)
        .update({ streak_atual: novoStreak, maior_streak: novoMaior, ultimo_estudo_em: hojeStr })
        .eq('id', aluno.id)
      // Medalha streak 3 dias
      if (novoStreak === 3) {
        const { data: mStreak } = await (adminClient.from('medalhas_config') as any)
          .select('id').eq('tipo', 'streak_3dias').maybeSingle()
        if (mStreak) await (adminClient.from('aluno_medalhas') as any)
          .upsert({ aluno_id: aluno.id, medalha_id: mStreak.id }, { onConflict: 'aluno_id,medalha_id' })
      }
    }
    // ─────────────────────────────────────────────────────────────

    if (percentual === 100) {
      await (adminClient.from('aluno_pontos') as any).insert({
        aluno_id: aluno.id,
        quantidade: 5,
        motivo: 'Bônus quiz perfeito',
      })
      const { data: medalhaPerfeito } = await (adminClient.from('medalhas_config') as any).select('id').eq('tipo', 'quiz_perfeito').maybeSingle()
      if (medalhaPerfeito) {
        await (adminClient.from('aluno_medalhas') as any).upsert({ aluno_id: aluno.id, medalha_id: medalhaPerfeito.id }, { onConflict: 'aluno_id,medalha_id' })
      }
    }

    const { data: progressoAprovado } = await (adminClient.from('progresso') as any)
      .select('aula_id')
      .eq('aluno_id', aluno.id)
      .eq('aprovado', true)
    const totalAulasAprovadas = new Set((progressoAprovado ?? []).map((p: { aula_id: string }) => p.aula_id)).size

    if (totalAulasAprovadas === 1) {
      const { data: medalhaPrimeira } = await (adminClient.from('medalhas_config') as any).select('id').eq('tipo', 'primeira_aula').maybeSingle()
      if (medalhaPrimeira) {
        await (adminClient.from('aluno_medalhas') as any).upsert({ aluno_id: aluno.id, medalha_id: medalhaPrimeira.id }, { onConflict: 'aluno_id,medalha_id' })
      }
    }

    const { data: aulasDoModulo } = await (adminClient.from('aulas') as any)
      .select('id')
      .eq('modulo_id', aula.modulo_id)
      .eq('publicado', true)

    if (aulasDoModulo) {
      const idsModulo = aulasDoModulo.map((a: { id: string }) => a.id)
      const { data: progressoModuloRows } = await (adminClient.from('progresso') as any)
        .select('aula_id')
        .eq('aluno_id', aluno.id)
        .eq('aprovado', true)
        .in('aula_id', idsModulo)

      const aulasAprovadas = new Set((progressoModuloRows ?? []).map((p: { aula_id: string }) => p.aula_id)).size
      if (aulasAprovadas === idsModulo.length) {
        const { data: medalhaModulo } = await (adminClient.from('medalhas_config') as any).select('id').eq('tipo', 'modulo_concluido').maybeSingle()
        if (medalhaModulo) {
          await (adminClient.from('aluno_medalhas') as any).upsert({ aluno_id: aluno.id, medalha_id: medalhaModulo.id }, { onConflict: 'aluno_id,medalha_id' })
        }
      }
    }

    const { data: todasAulas } = await (adminClient.from('aulas') as any)
      .select('id')
      .eq('publicado', true)
    if (todasAulas) {
      const todosIds = todasAulas.map((a: { id: string }) => a.id)
      const { data: todasAprovRows } = await (adminClient.from('progresso') as any)
        .select('aula_id')
        .eq('aluno_id', aluno.id)
        .eq('aprovado', true)
        .in('aula_id', todosIds)
      const totalAprovTotal = new Set((todasAprovRows ?? []).map((p: { aula_id: string }) => p.aula_id)).size
      if (totalAprovTotal === todosIds.length) {
        await (adminClient.from('aluno_pontos') as any).insert({ aluno_id: aluno.id, quantidade: 50, motivo: 'Bônus conclusão geral da trilha' })
        const { data: medalhaGraduado } = await (adminClient.from('medalhas_config') as any).select('id').eq('tipo', 'conclusao_geral').maybeSingle()
        if (medalhaGraduado) {
          await (adminClient.from('aluno_medalhas') as any).upsert({ aluno_id: aluno.id, medalha_id: medalhaGraduado.id }, { onConflict: 'aluno_id,medalha_id' })
        }
        // Verifica se já tem numero_registro antes de atribuir
        const { data: alunoAtual } = await (adminClient.from('alunos') as any)
          .select('numero_registro').eq('id', aluno.id).maybeSingle()
        let proximoNumero = alunoAtual?.numero_registro
        if (!proximoNumero) {
          const { data: maxRow } = await (adminClient.from('alunos') as any)
            .select('numero_registro').not('numero_registro', 'is', null)
            .order('numero_registro', { ascending: false }).limit(1).maybeSingle()
          proximoNumero = (maxRow?.numero_registro ?? 1000) + 1
        }
        await (adminClient.from('alunos') as any)
          .update({
            status: 'concluido',
            data_formacao: new Date().toISOString().split('T')[0],
            numero_registro: proximoNumero,
          })
          .eq('id', aluno.id)
      }
    }

    const { data: alunoComGestor } = await (adminClient.from('alunos') as any)
      .select('nome, gestor_nome, gestor_whatsapp, status')
      .eq('id', aluno.id)
      .maybeSingle()

    const { data: aulaAtual } = await (adminClient.from('aulas') as any)
      .select('modulo_id, modulo:modulos(titulo, ordem)')
      .eq('id', aula_id)
      .maybeSingle()

    if (aulaAtual && alunoComGestor?.gestor_whatsapp) {
      const { data: todasAulasModulo } = await (adminClient.from('aulas') as any)
        .select('id')
        .eq('modulo_id', aulaAtual.modulo_id)
        .eq('publicado', true)

      if (todasAulasModulo) {
        const { data: progressoModulo } = await (adminClient.from('progresso') as any)
          .select('aula_id')
          .eq('aluno_id', aluno.id)
          .eq('aprovado', true)
          .in('aula_id', todasAulasModulo.map((a: any) => a.id))

        const idsConcluidosModulo = [...new Set((progressoModulo ?? []).map((p: any) => p.aula_id))]
        const moduloConcluido = idsConcluidosModulo.length === todasAulasModulo.length

        if (moduloConcluido) {
          // Notifica gestor usando instância dele
          if (alunoComGestor?.gestor_whatsapp) {
            const instanciaGestor = await getInstanciaGestorPorNome(alunoComGestor.gestor_nome, adminClient)
            await enviarWhatsApp(
              alunoComGestor.gestor_whatsapp,
              `📚 Olá ${alunoComGestor.gestor_nome || 'Gestor'}! Seu consultor *${alunoComGestor.nome}* concluiu o *Módulo ${aulaAtual.modulo?.ordem}: ${aulaAtual.modulo?.titulo}*! 🎉`,
              instanciaGestor
            )
          }
          // Notifica o próprio consultor com link para gerar arte comemorativa
          const { data: alunoInfo } = await (adminClient.from('alunos') as any)
            .select('whatsapp, nome').eq('id', aluno.id).maybeSingle()
          if (alunoInfo?.whatsapp) {
            const appUrl = await getAppUrl()
            await enviarWhatsApp(
              alunoInfo.whatsapp,
              `🎉 Parabéns, *${alunoInfo.nome}*!\n\nVocê concluiu o *Módulo ${aulaAtual.modulo?.ordem}: ${aulaAtual.modulo?.titulo}*! 🏆\n\nContinue acessando a plataforma:\n👉 ${appUrl}/aluno/${alunoInfo.whatsapp}`
            )
          }
        }
      }
    }

    const { data: alunoAtualizado } = await (adminClient.from('alunos') as any)
      .select('status, gestor_nome, gestor_whatsapp, nome, whatsapp')
      .eq('id', aluno.id)
      .maybeSingle()

    if (alunoAtualizado?.status === 'concluido') {
      const appUrl = await getAppUrl()
      const instanciaGestor = alunoAtualizado?.gestor_nome
        ? await getInstanciaGestorPorNome(alunoAtualizado.gestor_nome, adminClient)
        : null
      // Notifica gestor usando instância dele
      if (alunoAtualizado?.gestor_whatsapp) {
        await enviarWhatsApp(
          alunoAtualizado.gestor_whatsapp,
          `🏆 PARABÉNS, ${alunoAtualizado.gestor_nome || 'Gestor'}!\n\nSeu consultor *${alunoAtualizado.nome}* concluiu 100% da formação! 🎓✨\n\nVer progresso: ${appUrl}/aluno/${alunoAtualizado.whatsapp}`,
          instanciaGestor
        )
      }
      // Notifica o próprio consultor — usa instância global (não a do gestor)
      if (alunoAtualizado?.whatsapp) {
        await enviarWhatsApp(
          alunoAtualizado.whatsapp,
          `🎓 *PARABÉNS, ${alunoAtualizado.nome}!*\n\nVocê concluiu 100% da formação! 🏆✨\n\nCrie sua arte de formatura:\n👉 ${appUrl}/aluno/${alunoAtualizado.whatsapp}/artes`
        )
      }
    }
  }

  return NextResponse.json({ ok: true, acertos, total, percentual, aprovado })
}

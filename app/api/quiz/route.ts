import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaGestorPorNome } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'
import { getMensagem } from '@/lib/mensagem'
import { dispararGatilhoContrato } from '@/lib/contrato-gatilho'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await adminClient.from('alunos').select('id, tenant_id').eq('user_id', user.id).maybeSingle()
  if (!aluno) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })

  const body = await req.json()
  const { aula_id, respostas: respostasEnviadas, pular } = body

  const { data: aula } = await adminClient.from('aulas')
    .select('id, quiz_qtd_questoes, quiz_aprovacao_minima, espera_horas, modulo_id, liberacao_modo, quiz_tipo')
    .eq('id', aula_id)
    .single()
  if (!aula) return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })

  // Sem quiz, indicativo ou sim_nao — aluno pulou ou aula sem quiz (video terminou sem questões)
  if (pular && (!aula.quiz_tipo || aula.quiz_tipo === 'indicativo' || aula.quiz_tipo === 'sim_nao')) {
    // Idempotencia: ignora se já existe progresso aprovado para esta aula
    const { data: jaExiste } = await adminClient.from('progresso')
      .select('id').eq('aluno_id', aluno.id).eq('aula_id', aula_id).eq('aprovado', true).limit(1).maybeSingle()
    if (jaExiste) return NextResponse.json({ ok: true, pulado: true, aprovado: true })

    const liberada_em = new Date(Date.now() + (aula.espera_horas ?? 0) * 3600000).toISOString()
    const { error: errInsert } = await adminClient.from('progresso').insert({
      aluno_id: aluno.id, aula_id,
      tentativa_numero: 1, acertos: 0, total_questoes: 0,
      percentual: 0, aprovado: true, respostas: {},
      proxima_aula_liberada_em: liberada_em, pendente_liberacao: false,
    })
    if (errInsert) return NextResponse.json({ error: 'Erro ao salvar progresso.' }, { status: 500 })

    await adminClient.from('aluno_pontos').insert({
      aluno_id: aluno.id, quantidade: 5, motivo: `Quiz indicativo visto - aula ${aula_id}`,
    })
    return NextResponse.json({ ok: true, pulado: true, aprovado: true })
  }

  const { data: questoes } = await adminClient.from('questoes')
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

  const { data: tentativaAnterior } = await adminClient.from('progresso')
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

  const { error: errProgresso } = await adminClient.from('progresso').insert({
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
  if (errProgresso) return NextResponse.json({ error: 'Erro ao salvar progresso.' }, { status: 500 })

  // Notifica gestor/admin sobre liberação pendente
  if (pendente_liberacao) {
    const { data: alunoInfo } = await adminClient.from('alunos')
      .select('nome, gestor_nome, gestor_whatsapp').eq('id', aluno.id).maybeSingle()
    const { data: aulaInfo } = await adminClient.from('aulas')
      .select('titulo').eq('id', aula_id).maybeSingle()
    if (modo === 'manual_gestor' && alunoInfo?.gestor_whatsapp) {
      const inst = await getInstanciaGestorPorNome(alunoInfo.gestor_nome ?? '', adminClient, aluno.tenant_id)
      const appUrl = await getAppUrl(aluno.tenant_id)
      await enviarWhatsApp(
        alunoInfo.gestor_whatsapp,
        `📋 *${alunoInfo.nome}* foi aprovado na aula *${aulaInfo?.titulo}* e está aguardando sua liberação para continuar.\n\nAcesse o painel: ${appUrl}/pro`,
        inst
      )
    }
    return NextResponse.json({ ok: true, acertos, total, percentual, aprovado, pendente_liberacao: true, modo })
  }

  if (aprovado) {
    await adminClient.from('aluno_pontos').insert({
      aluno_id: aluno.id,
      quantidade: 10,
      motivo: `Quiz aprovado - aula ${aula_id}`,
    })

    // ── Streak de estudo ──────────────────────────────────────────
    const hojeStr = new Date().toISOString().split('T')[0]
    const ontemStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const { data: streakInfo } = await adminClient.from('alunos')
      .select('streak_atual, maior_streak, ultimo_estudo_em').eq('id', aluno.id).maybeSingle()
    if (streakInfo !== null) {
      let novoStreak = 1
      if (streakInfo.ultimo_estudo_em === hojeStr) {
        novoStreak = streakInfo.streak_atual || 1 // já estudou hoje
      } else if (streakInfo.ultimo_estudo_em === ontemStr) {
        novoStreak = (streakInfo.streak_atual || 0) + 1 // dia consecutivo
      }
      const novoMaior = Math.max(novoStreak, streakInfo.maior_streak || 0)
      await adminClient.from('alunos')
        .update({ streak_atual: novoStreak, maior_streak: novoMaior, ultimo_estudo_em: hojeStr })
        .eq('id', aluno.id)
      // Medalha streak 3 dias
      if (novoStreak === 3) {
        const { data: mStreak } = await adminClient.from('medalhas_config')
          .select('id').eq('tipo', 'streak_3dias').maybeSingle()
        if (mStreak) await adminClient.from('aluno_medalhas')
          .upsert({ aluno_id: aluno.id, medalha_id: mStreak.id }, { onConflict: 'aluno_id,medalha_id' })
      }
    }
    // ─────────────────────────────────────────────────────────────

    if (percentual === 100) {
      await adminClient.from('aluno_pontos').insert({
        aluno_id: aluno.id,
        quantidade: 5,
        motivo: 'Bônus quiz perfeito',
      })
      const { data: medalhaPerfeito } = await adminClient.from('medalhas_config').select('id').eq('tipo', 'quiz_perfeito').maybeSingle()
      if (medalhaPerfeito) {
        await adminClient.from('aluno_medalhas').upsert({ aluno_id: aluno.id, medalha_id: medalhaPerfeito.id }, { onConflict: 'aluno_id,medalha_id' })
      }
    }

    const { data: progressoAprovado } = await adminClient.from('progresso')
      .select('aula_id')
      .eq('aluno_id', aluno.id)
      .eq('aprovado', true)
    const totalAulasAprovadas = new Set((progressoAprovado ?? []).map((p: { aula_id: string }) => p.aula_id)).size

    if (totalAulasAprovadas === 1) {
      const { data: medalhaPrimeira } = await adminClient.from('medalhas_config').select('id').eq('tipo', 'primeira_aula').maybeSingle()
      if (medalhaPrimeira) {
        await adminClient.from('aluno_medalhas').upsert({ aluno_id: aluno.id, medalha_id: medalhaPrimeira.id }, { onConflict: 'aluno_id,medalha_id' })
      }
    }

    const { data: aulasDoModulo } = await adminClient.from('aulas')
      .select('id')
      .eq('modulo_id', aula.modulo_id)
      .eq('publicado', true)

    if (aulasDoModulo) {
      const idsModulo = aulasDoModulo.map((a: { id: string }) => a.id)
      const { data: progressoModuloRows } = await adminClient.from('progresso')
        .select('aula_id')
        .eq('aluno_id', aluno.id)
        .eq('aprovado', true)
        .in('aula_id', idsModulo)

      const aulasAprovadas = new Set((progressoModuloRows ?? []).map((p: { aula_id: string }) => p.aula_id)).size
      if (aulasAprovadas === idsModulo.length) {
        const { data: medalhaModulo } = await adminClient.from('medalhas_config').select('id').eq('tipo', 'modulo_concluido').maybeSingle()
        if (medalhaModulo) {
          await adminClient.from('aluno_medalhas').upsert({ aluno_id: aluno.id, medalha_id: medalhaModulo.id }, { onConflict: 'aluno_id,medalha_id' })
        }
      }
    }

    let todasAulasQ = adminClient.from('aulas').select('id').eq('publicado', true)
    if (aluno.tenant_id) todasAulasQ = todasAulasQ.eq('tenant_id', aluno.tenant_id)
    const { data: todasAulas } = await todasAulasQ
    if (todasAulas) {
      const todosIds = todasAulas.map((a: { id: string }) => a.id)
      const { data: todasAprovRows } = await adminClient.from('progresso')
        .select('aula_id')
        .eq('aluno_id', aluno.id)
        .eq('aprovado', true)
        .in('aula_id', todosIds)
      const totalAprovTotal = new Set((todasAprovRows ?? []).map((p: { aula_id: string }) => p.aula_id)).size
      if (totalAprovTotal === todosIds.length) {
        await adminClient.from('aluno_pontos').insert({ aluno_id: aluno.id, quantidade: 50, motivo: 'Bônus conclusão geral da trilha' })
        const { data: medalhaGraduado } = await adminClient.from('medalhas_config').select('id').eq('tipo', 'conclusao_geral').maybeSingle()
        if (medalhaGraduado) {
          await adminClient.from('aluno_medalhas').upsert({ aluno_id: aluno.id, medalha_id: medalhaGraduado.id }, { onConflict: 'aluno_id,medalha_id' })
        }
        // Verifica se já tem numero_registro antes de atribuir (idempotente)
        const { data: alunoAtual } = await adminClient.from('alunos')
          .select('numero_registro').eq('id', aluno.id).maybeSingle()
        let proximoNumero = alunoAtual?.numero_registro
        if (!proximoNumero) {
          // Usa sequence atomica do Postgres para evitar race condition
          const { data: seq } = await adminClient.rpc('gerar_numero_registro_aluno' as any)
          proximoNumero = seq as number
        }
        await adminClient.from('alunos')
          .update({
            status: 'concluido',
            data_formacao: new Date().toISOString().split('T')[0],
            numero_registro: proximoNumero,
          })
          .eq('id', aluno.id)
      }
    }

    // Busca estado atualizado do aluno (após possível update de status acima)
    const { data: alunoAtualizado } = await adminClient.from('alunos')
      .select('status, gestor_nome, gestor_whatsapp, nome, whatsapp')
      .eq('id', aluno.id)
      .maybeSingle()

    const formacaoConcluida = alunoAtualizado?.status === 'concluido'

    // Notificação de módulo concluído — só envia se a formação completa NÃO foi concluída agora
    // (se foi, o bloco abaixo já envia uma mensagem mais completa)
    if (!formacaoConcluida) {
      const { data: aulaAtual } = await adminClient.from('aulas')
        .select('modulo_id, modulo:modulos(titulo, ordem)')
        .eq('id', aula_id)
        .maybeSingle()

      if (aulaAtual && alunoAtualizado?.gestor_whatsapp) {
        const { data: todasAulasModulo } = await adminClient.from('aulas')
          .select('id')
          .eq('modulo_id', aulaAtual.modulo_id)
          .eq('publicado', true)

        if (todasAulasModulo) {
          const { data: progressoModulo } = await adminClient.from('progresso')
            .select('aula_id')
            .eq('aluno_id', aluno.id)
            .eq('aprovado', true)
            .in('aula_id', todasAulasModulo.map((a: any) => a.id))

          const idsConcluidosModulo = [...new Set((progressoModulo ?? []).map((p: any) => p.aula_id))]
          const moduloConcluido = idsConcluidosModulo.length === todasAulasModulo.length

          if (moduloConcluido) {
            const instanciaGestor = await getInstanciaGestorPorNome(alunoAtualizado.gestor_nome ?? '', adminClient, aluno.tenant_id)
            const appUrl = await getAppUrl(aluno.tenant_id)
            const varsModulo = {
              gestorNome: alunoAtualizado.gestor_nome || 'PRO',
              alunoNome: alunoAtualizado.nome,
              moduloOrdem: String(aulaAtual.modulo?.ordem ?? ''),
              moduloTitulo: String(aulaAtual.modulo?.titulo ?? ''),
              whatsapp: alunoAtualizado.whatsapp,
              appUrl,
            }
            await enviarWhatsApp(alunoAtualizado.gestor_whatsapp!,
              await getMensagem('modulo_concluido_gestor', varsModulo, adminClient, aluno.tenant_id),
              instanciaGestor)
            await enviarWhatsApp(alunoAtualizado.whatsapp,
              await getMensagem('modulo_concluido_aluno', varsModulo, adminClient, aluno.tenant_id))

            // Dispara gatilhos de contrato configurados para este modulo
            dispararGatilhoContrato({
              tipo: 'modulo',
              refId: aulaAtual.modulo_id,
              alunoId: aluno.id,
              tenantId: aluno.tenant_id,
              appUrl,
            }).catch(() => {})
          }
        }
      }
    }

    // Notificação de formação 100% concluída
    if (formacaoConcluida) {
      const appUrl = await getAppUrl(aluno.tenant_id)
      const instanciaGestor = alunoAtualizado.gestor_nome
        ? await getInstanciaGestorPorNome(alunoAtualizado.gestor_nome, adminClient, aluno.tenant_id)
        : null
      const varsFormacao = {
        gestorNome: alunoAtualizado.gestor_nome || 'PRO',
        alunoNome: alunoAtualizado.nome,
        whatsapp: alunoAtualizado.whatsapp,
        appUrl,
      }
      if (alunoAtualizado.gestor_whatsapp) {
        await enviarWhatsApp(alunoAtualizado.gestor_whatsapp,
          await getMensagem('formacao_concluida_gestor', varsFormacao, adminClient, aluno.tenant_id),
          instanciaGestor)
      }
      if (alunoAtualizado.whatsapp) {
        await enviarWhatsApp(alunoAtualizado.whatsapp,
          await getMensagem('formacao_concluida_aluno', varsFormacao, adminClient, aluno.tenant_id))
      }

      // Dispara gatilhos de contrato configurados para conclusao geral
      dispararGatilhoContrato({
        tipo: 'curso_completo',
        refId: null,
        alunoId: aluno.id,
        tenantId: aluno.tenant_id,
        appUrl,
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true, acertos, total, percentual, aprovado })
}

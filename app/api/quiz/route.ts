import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any).select('id').eq('user_id', user.id).maybeSingle()
  if (!aluno) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })

  const body = await req.json()
  const { aula_id, respostas: respostasEnviadas } = body

  const { data: aula } = await (adminClient.from('aulas') as any)
    .select('id, quiz_qtd_questoes, quiz_aprovacao_minima, espera_horas, modulo_id')
    .eq('id', aula_id)
    .single()
  if (!aula) return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })

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
  const proxima_aula_liberada_em = aprovado ? new Date(Date.now() + aula.espera_horas * 3600000).toISOString() : null

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
  })

  if (aprovado) {
    await (adminClient.from('aluno_pontos') as any).insert({
      aluno_id: aluno.id,
      quantidade: 10,
      motivo: `Quiz aprovado - aula ${aula_id}`,
    })

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

    const { count: totalAprovadas } = await (adminClient.from('progresso') as any)
      .select('id', { count: 'exact', head: true })
      .eq('aluno_id', aluno.id)
      .eq('aprovado', true)

    if (totalAprovadas === 1) {
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
      const { count: aprovadas } = await (adminClient.from('progresso') as any)
        .select('id', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id)
        .eq('aprovado', true)
        .in('aula_id', idsModulo)

      if (aprovadas === idsModulo.length) {
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
      const { count: totalAprovTotal } = await (adminClient.from('progresso') as any)
        .select('id', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id)
        .eq('aprovado', true)
        .in('aula_id', todosIds)
      if (totalAprovTotal === todosIds.length) {
        await (adminClient.from('aluno_pontos') as any).insert({ aluno_id: aluno.id, quantidade: 50, motivo: 'Bônus conclusão geral da trilha' })
        const { data: medalhaGraduado } = await (adminClient.from('medalhas_config') as any).select('id').eq('tipo', 'conclusao_geral').maybeSingle()
        if (medalhaGraduado) {
          await (adminClient.from('aluno_medalhas') as any).upsert({ aluno_id: aluno.id, medalha_id: medalhaGraduado.id }, { onConflict: 'aluno_id,medalha_id' })
        }
        await (adminClient.from('alunos') as any)
          .update({ status: 'concluido' })
          .eq('id', aluno.id)
      }
    }

    const { data: alunoComGestor } = await (adminClient.from('alunos') as any)
      .select('nome, gestor_nome, gestor_whatsapp, status')
      .eq('id', aluno.id)
      .maybeSingle()

    const { data: aulaAtual } = await (adminClient.from('aulas') as any)
      .select('modulo_id, modulos(titulo, ordem)')
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
          await enviarWhatsApp(
            alunoComGestor.gestor_whatsapp,
            `📚 Olá ${alunoComGestor.gestor_nome || 'Gestor'}! Seu consultor *${alunoComGestor.nome}* concluiu o *Módulo ${aulaAtual.modulos?.ordem}: ${aulaAtual.modulos?.titulo}* na Universidade AVP! 🎉`
          )
        }
      }
    }

    const { data: alunoAtualizado } = await (adminClient.from('alunos') as any)
      .select('status, gestor_nome, gestor_whatsapp, nome')
      .eq('id', aluno.id)
      .maybeSingle()

    if (alunoAtualizado?.status === 'concluido' && alunoAtualizado?.gestor_whatsapp) {
      await enviarWhatsApp(
        alunoAtualizado.gestor_whatsapp,
        `🏆 PARABÉNS, ${alunoAtualizado.gestor_nome || 'Gestor'}!\n\nSeu consultor *${alunoAtualizado.nome}* concluiu 100% da formação na *Universidade Auto Vale Prevenções* e está pronto para ser um Consultor AVP de sucesso! 🎓✨\n\nAcesse a plataforma para ver o certificado: ${process.env.NEXT_PUBLIC_APP_URL}/aluno/${aluno.id}`
      )
    }
  }

  return NextResponse.json({ ok: true, acertos, total, percentual, aprovado })
}

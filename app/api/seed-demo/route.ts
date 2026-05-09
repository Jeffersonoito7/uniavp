import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function GET() {
  const admin = createServiceRoleClient()
  const log: string[] = []

  try {
    // ─── 1. GESTOR ────────────────────────────────────────────────
    const gestorEmail = 'carlos.gestor@uniavp.demo'
    const gestorWhatsapp = '85999990001'

    // Apaga se já existir
    const { data: gestorExistente } = await (admin.from('gestores') as any)
      .select('id, user_id').eq('whatsapp', gestorWhatsapp).maybeSingle()
    if (gestorExistente) {
      await (admin.from('gestores') as any).delete().eq('id', gestorExistente.id)
      if (gestorExistente.user_id) await admin.auth.admin.deleteUser(gestorExistente.user_id).catch(() => {})
    }

    const { data: authGestor } = await admin.auth.admin.createUser({
      email: gestorEmail, password: 'Demo@2025', email_confirm: true,
    })
    const { data: gestor } = await (admin.from('gestores') as any)
      .insert({ user_id: authGestor!.user!.id, nome: 'Carlos Gestor Demo', email: gestorEmail, whatsapp: gestorWhatsapp, ativo: true })
      .select().single()
    log.push(`✅ Gestor criado: ${gestor.nome} | ${gestorEmail} | senha: Demo@2025`)

    // ─── 2. CONSULTOR ─────────────────────────────────────────────
    const consultorEmail = 'ana.consultora@uniavp.demo'
    const consultorWhatsapp = '85999990002'

    const { data: alunoExistente } = await (admin.from('alunos') as any)
      .select('id, user_id').eq('whatsapp', consultorWhatsapp).maybeSingle()
    if (alunoExistente) {
      await (admin.from('alunos') as any).delete().eq('id', alunoExistente.id)
      if (alunoExistente.user_id) await admin.auth.admin.deleteUser(alunoExistente.user_id).catch(() => {})
    }

    const { data: authAluno } = await admin.auth.admin.createUser({
      email: consultorEmail, password: 'Demo@2025', email_confirm: true,
    })
    await (admin.from('alunos') as any).insert({
      user_id: authAluno!.user!.id,
      nome: 'Ana Consultora Demo',
      whatsapp: consultorWhatsapp,
      email: consultorEmail,
      status: 'ativo',
      gestor_nome: 'Carlos Gestor Demo',
      gestor_whatsapp: gestorWhatsapp,
    })
    log.push(`✅ Consultor criado: Ana Consultora Demo | ${consultorEmail} | senha: Demo@2025`)

    // ─── 3. MÓDULO + AULAS ────────────────────────────────────────
    const { data: moduloExistente } = await (admin.from('modulos') as any)
      .select('id').eq('titulo', 'Módulo Demo — Formação de Consultor').maybeSingle()
    if (moduloExistente) {
      await (admin.from('aulas') as any).delete().eq('modulo_id', moduloExistente.id)
      await (admin.from('modulos') as any).delete().eq('id', moduloExistente.id)
    }

    const { data: modulo } = await (admin.from('modulos') as any)
      .insert({ titulo: 'Módulo Demo — Formação de Consultor', descricao: 'Módulo criado para demonstração do sistema', ordem: 99, publicado: true })
      .select().single()

    const aulas = [
      { titulo: 'Aula 1 — Boas-vindas ao Programa', youtube_video_id: '8aGhZQkoFbQ', duracao_minutos: 15 },
      { titulo: 'Aula 2 — O Mercado e Suas Oportunidades', youtube_video_id: 'M7lc1UVf-VE', duracao_minutos: 20 },
      { titulo: 'Aula 3 — Como Abordar Clientes com Confiança', youtube_video_id: 'aircAruvnKk', duracao_minutos: 18 },
    ]

    for (let i = 0; i < aulas.length; i++) {
      const a = aulas[i]
      await (admin.from('aulas') as any).insert({
        modulo_id: modulo.id,
        titulo: a.titulo,
        youtube_video_id: a.youtube_video_id,
        duracao_minutos: a.duracao_minutos,
        ordem: i + 1,
        espera_horas: i === 0 ? 0 : 24,
        quiz_qtd_questoes: 3,
        quiz_aprovacao_minima: 70,
        publicado: true,
      })
    }
    log.push(`✅ Módulo criado com ${aulas.length} aulas publicadas`)

    // ─── 4. QUESTÕES para a Aula 1 ────────────────────────────────
    const { data: aula1 } = await (admin.from('aulas') as any)
      .select('id').eq('modulo_id', modulo.id).eq('ordem', 1).single()

    const questoes = [
      {
        enunciado: 'Qual é o principal objetivo da formação de consultores?',
        opcoes: ['Vender o maior número de produtos', 'Capacitar profissionais para atender clientes com qualidade', 'Aprender só a parte técnica', 'Nenhuma das anteriores'],
        resposta_correta: 1,
      },
      {
        enunciado: 'Quantas horas de espera existem entre aulas neste módulo demo?',
        opcoes: ['0 horas', '12 horas', '24 horas', '48 horas'],
        resposta_correta: 2,
      },
      {
        enunciado: 'O que você precisa para ser aprovado no quiz?',
        opcoes: ['50% de acertos', '60% de acertos', '70% de acertos', '100% de acertos'],
        resposta_correta: 2,
      },
    ]

    for (const q of questoes) {
      await (admin.from('questoes') as any).insert({
        aula_id: aula1.id,
        enunciado: q.enunciado,
        opcoes: q.opcoes,
        resposta_correta: q.resposta_correta,
      })
    }
    log.push(`✅ 3 questões criadas para a Aula 1`)

  } catch (e: any) {
    log.push(`❌ Erro: ${e.message}`)
    return NextResponse.json({ ok: false, log }, { status: 500 })
  }

  return NextResponse.json({ ok: true, log, instrucoes: {
    gestor: { email: 'carlos.gestor@uniavp.demo', senha: 'Demo@2025', link: '/gestor' },
    consultor: { email: 'ana.consultora@uniavp.demo', senha: 'Demo@2025', link: '/login' },
    admin: 'Acesse /admin para ver o módulo e os usuários criados',
  }})
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { DEMO_PASSWORD } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_DEMO_ALLOW_PROD) {
    return NextResponse.json({ error: 'Seed desabilitado em produção' }, { status: 403 })
  }
  const token = req.nextUrl.searchParams.get('token')
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }
  const admin = createServiceRoleClient()
  const log: string[] = []

  try {
    // ─── 1. GESTOR ────────────────────────────────────────────────
    const gestorEmail = 'carlos.gestor@uniavp.demo'
    const gestorWhatsapp = '85999990001'

    // Apaga se já existir
    const { data: gestorExistente } = await admin.from('gestores')
      .select('id, user_id').eq('whatsapp', gestorWhatsapp).maybeSingle()
    if (gestorExistente) {
      await admin.from('gestores').delete().eq('id', gestorExistente.id)
      if (gestorExistente.user_id) await admin.auth.admin.deleteUser(gestorExistente.user_id).catch(() => {})
    }

    const { data: authGestor } = await admin.auth.admin.createUser({
      email: gestorEmail, password: DEMO_PASSWORD, email_confirm: true,
    })
    const { data: gestor } = await admin.from('gestores')
      .insert({ user_id: authGestor!.user!.id, nome: 'Carlos Gestor Demo', email: gestorEmail, whatsapp: gestorWhatsapp, ativo: true })
      .select().single()
    log.push(`✅ Gestor criado: ${gestor!.nome} | ${gestorEmail} | senha: ${DEMO_PASSWORD}`)

    // ─── 2. CONSULTOR ─────────────────────────────────────────────
    const consultorEmail = 'ana.consultora@uniavp.demo'
    const consultorWhatsapp = '85999990002'

    const { data: alunoExistente } = await admin.from('alunos')
      .select('id, user_id').eq('whatsapp', consultorWhatsapp).maybeSingle()
    if (alunoExistente) {
      await admin.from('alunos').delete().eq('id', alunoExistente.id)
      if (alunoExistente.user_id) await admin.auth.admin.deleteUser(alunoExistente.user_id).catch(() => {})
    }

    const { data: authAluno } = await admin.auth.admin.createUser({
      email: consultorEmail, password: DEMO_PASSWORD, email_confirm: true,
    })
    await admin.from('alunos').insert({
      user_id: authAluno!.user!.id,
      nome: 'Ana Consultora Demo',
      whatsapp: consultorWhatsapp,
      email: consultorEmail,
      status: 'ativo',
      gestor_nome: 'Carlos Gestor Demo',
      gestor_whatsapp: gestorWhatsapp,
    })
    log.push(`✅ Consultor criado: Ana Consultora Demo | ${consultorEmail} | senha: ${DEMO_PASSWORD}`)

    // ─── 3. MÓDULO + AULAS ────────────────────────────────────────
    const { data: moduloExistente } = await admin.from('modulos')
      .select('id').eq('titulo', 'Módulo Demo — Formação de Consultor').maybeSingle()
    if (moduloExistente) {
      await admin.from('aulas').delete().eq('modulo_id', moduloExistente.id)
      await admin.from('modulos').delete().eq('id', moduloExistente.id)
    }

    const { data: modulo } = await admin.from('modulos')
      .insert({ titulo: 'Módulo Demo — Formação de Consultor', descricao: 'Módulo criado para demonstração do sistema', ordem: 99, publicado: true })
      .select().single()

    const aulas = [
      { titulo: 'Aula 1 — Boas-vindas ao Programa', youtube_video_id: '8aGhZQkoFbQ', duracao_minutos: 15 },
      { titulo: 'Aula 2 — O Mercado e Suas Oportunidades', youtube_video_id: 'M7lc1UVf-VE', duracao_minutos: 20 },
      { titulo: 'Aula 3 — Como Abordar Clientes com Confiança', youtube_video_id: 'aircAruvnKk', duracao_minutos: 18 },
    ]

    for (let i = 0; i < aulas.length; i++) {
      const a = aulas[i]
      await admin.from('aulas').insert({
        modulo_id: modulo!.id,
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
    const { data: aula1 } = await admin.from('aulas')
      .select('id').eq('modulo_id', modulo!.id).eq('ordem', 1).single()

    const questoes = [
      {
        enunciado: 'Qual é o principal objetivo da formação de consultores?',
        alternativas: [
          { texto: 'Vender o maior número de produtos', correta: false },
          { texto: 'Capacitar profissionais para atender clientes com qualidade', correta: true },
          { texto: 'Aprender só a parte técnica', correta: false },
          { texto: 'Nenhuma das anteriores', correta: false },
        ],
      },
      {
        enunciado: 'Quantas horas de espera existem entre aulas neste módulo demo?',
        alternativas: [
          { texto: '0 horas', correta: false },
          { texto: '12 horas', correta: false },
          { texto: '24 horas', correta: true },
          { texto: '48 horas', correta: false },
        ],
      },
      {
        enunciado: 'O que você precisa para ser aprovado no quiz?',
        alternativas: [
          { texto: '50% de acertos', correta: false },
          { texto: '60% de acertos', correta: false },
          { texto: '70% de acertos', correta: true },
          { texto: '100% de acertos', correta: false },
        ],
      },
    ]

    for (let i = 0; i < questoes.length; i++) {
      const q = questoes[i]
      await admin.from('questoes').insert({
        aula_id: aula1!.id,
        enunciado: q.enunciado,
        alternativas: q.alternativas,
        ordem: i + 1,
      })
    }
    log.push(`✅ 3 questões criadas para a Aula 1`)

  } catch (e: any) {
    log.push(`❌ Erro: ${e.message}`)
    return NextResponse.json({ ok: false, log }, { status: 500 })
  }

  return NextResponse.json({ ok: true, log, instrucoes: {
    gestor: { email: 'carlos.gestor@uniavp.demo', senha: DEMO_PASSWORD, link: '/gestor' },
    consultor: { email: 'ana.consultora@uniavp.demo', senha: DEMO_PASSWORD, link: '/login' },
    admin: 'Acesse /admin para ver o módulo e os usuários criados',
  }})
}

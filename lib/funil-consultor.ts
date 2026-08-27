import type { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { createLogger } from '@/lib/logger'

type AdminClient = ReturnType<typeof createServiceRoleClient>

const log = createLogger('funil-consultor')

type Alternativa = { texto: string; correta: boolean }
type Pergunta = { id: string; ordem: number; texto: string; alternativas: Alternativa[] }

type AlunoFunil = {
  id: string
  nome: string
  whatsapp: string
  tenant_id: string | null
  funil_estado: number
  funil_pergunta_atual: number
  funil_respostas: number[]
}

async function getConfig(chave: string, tenantId: string | null, adminClient: AdminClient): Promise<string | null> {
  // Tenta config do tenant primeiro
  if (tenantId) {
    const { data } = await adminClient.from('configuracoes' as any)
      .select('valor')
      .eq('chave', chave)
      .eq('tenant_id', tenantId)
      .maybeSingle()
    if ((data as any)?.valor != null) return JSON.parse(JSON.stringify((data as any).valor)).toString().replace(/^"|"$/g, '')
  }
  // Fallback global
  const { data } = await adminClient.from('configuracoes' as any)
    .select('valor')
    .eq('chave', chave)
    .is('tenant_id', null)
    .maybeSingle()
  const raw = (data as any)?.valor
  if (!raw) return null
  if (typeof raw === 'string') return raw.replace(/^"|"$/g, '')
  return String(raw)
}

async function getPerguntas(tenantId: string | null, adminClient: AdminClient): Promise<Pergunta[]> {
  let q = (adminClient.from('funil_perguntas' as any) as any)
    .select('id, ordem, texto, alternativas')
    .eq('ativa', true)
    .order('ordem')
  if (tenantId) q = q.eq('tenant_id', tenantId)
  else q = q.is('tenant_id', null)
  const { data } = await q
  return (data ?? []) as Pergunta[]
}

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function parsearResposta(msg: string): number | null {
  const n = normalizar(msg)
  if (n === 'a' || n === '1') return 0
  if (n === 'b' || n === '2') return 1
  if (n === 'c' || n === '3') return 2
  if (n === 'd' || n === '4') return 3
  return null
}

function formatarPergunta(p: Pergunta, indice: number, total: number): string {
  const letras = ['A', 'B', 'C', 'D']
  const alts = (p.alternativas as Alternativa[])
    .map((a, i) => `${letras[i]}) ${a.texto}`)
    .join('\n')
  return `*Pergunta ${indice + 1} de ${total}*\n\n${p.texto}\n\n${alts}\n\nResponda com A, B, C ou D.`
}

export async function processarMensagemFunil(
  aluno: AlunoFunil,
  mensagem: string,
  instancia: string | null | undefined,
  adminClient: AdminClient,
): Promise<boolean> {
  const { funil_estado: estado } = aluno
  if (estado === 0 || estado === 4 || estado === -1) return false

  const msg = normalizar(mensagem)

  if (estado === 1) {
    await processarEstado1(aluno, msg, instancia, adminClient)
    return true
  }
  if (estado === 2) {
    await processarEstado2(aluno, msg, instancia, adminClient)
    return true
  }
  if (estado === 3) {
    await processarEstado3(aluno, msg, instancia, adminClient)
    return true
  }

  return false
}

async function processarEstado1(
  aluno: AlunoFunil,
  msg: string,
  instancia: string | null | undefined,
  adminClient: AdminClient,
) {
  const sim = ['sim', 's', '1', 'yes', 'quero', 'pode', 'claro', 'com certeza', 'top']
  const nao = ['nao', 'n', '2', 'no', 'nope', 'agora nao', 'nao quero', 'cancelar']

  if (sim.some(p => msg === p || msg.startsWith(p + ' '))) {
    const linkVideo = await getConfig('funil_video_pp', aluno.tenant_id, adminClient)
    await (adminClient.from('alunos') as any).update({ funil_estado: 2 }).eq('id', aluno.id)
    await enviarWhatsApp(
      aluno.whatsapp,
      `Que otimo, ${aluno.nome.split(' ')[0]}! Estou feliz com sua decisao.\n\n` +
      `*Modulo Primeiros Passos*\n\nAssista ao video abaixo até o fim antes de continuar:\n\n` +
      `${linkVideo ?? '[link nao configurado]'}\n\n` +
      `Quando terminar, responda aqui com "assisti" para continuar.`,
      instancia,
    )
    return
  }

  if (nao.some(p => msg === p || msg.startsWith(p + ' '))) {
    await (adminClient.from('alunos') as any).update({ funil_estado: -1 }).eq('id', aluno.id)
    await enviarWhatsApp(
      aluno.whatsapp,
      `Tudo bem, ${aluno.nome.split(' ')[0]}! Se mudar de ideia e so me chamar. Sucesso!`,
      instancia,
    )
    return
  }

  await enviarWhatsApp(
    aluno.whatsapp,
    'Por favor, responda apenas *Sim* ou *Nao* para continuar.',
    instancia,
  )
}

async function processarEstado2(
  aluno: AlunoFunil,
  msg: string,
  instancia: string | null | undefined,
  adminClient: AdminClient,
) {
  const confirmacoes = ['assisti', 'sim', 'ok', 'pronto', 'vi', 'assistido', 'terminei', 'concluido', 'pronto']

  if (confirmacoes.some(p => msg.startsWith(p))) {
    const perguntas = await getPerguntas(aluno.tenant_id, adminClient)

    if (perguntas.length === 0) {
      // Sem perguntas cadastradas — pula direto para estado 4
      await concluirFunil(aluno, instancia, adminClient)
      return
    }

    await (adminClient.from('alunos') as any)
      .update({ funil_estado: 3, funil_pergunta_atual: 0, funil_respostas: [] })
      .eq('id', aluno.id)

    await enviarWhatsApp(
      aluno.whatsapp,
      `Otimo! Agora vamos testar o que voce aprendeu.\n\n${formatarPergunta(perguntas[0], 0, perguntas.length)}`,
      instancia,
    )
    return
  }

  await enviarWhatsApp(
    aluno.whatsapp,
    'Assista o video até o fim e depois responda "assisti" para continuar.',
    instancia,
  )
}

async function processarEstado3(
  aluno: AlunoFunil,
  msg: string,
  instancia: string | null | undefined,
  adminClient: AdminClient,
) {
  const resposta = parsearResposta(msg)
  if (resposta === null) {
    await enviarWhatsApp(
      aluno.whatsapp,
      'Responda apenas com a letra: *A*, *B*, *C* ou *D*.',
      instancia,
    )
    return
  }

  const perguntas = await getPerguntas(aluno.tenant_id, adminClient)
  const respostas = [...(aluno.funil_respostas as number[]), resposta]
  const proxima = aluno.funil_pergunta_atual + 1

  if (proxima < perguntas.length) {
    await (adminClient.from('alunos') as any)
      .update({ funil_pergunta_atual: proxima, funil_respostas: respostas })
      .eq('id', aluno.id)
    await enviarWhatsApp(
      aluno.whatsapp,
      formatarPergunta(perguntas[proxima], proxima, perguntas.length),
      instancia,
    )
    return
  }

  // Quiz concluido — calcular nota
  let acertos = 0
  for (let i = 0; i < perguntas.length; i++) {
    const alts = perguntas[i].alternativas as Alternativa[]
    const idxCorreta = alts.findIndex(a => a.correta)
    if (respostas[i] === idxCorreta) acertos++
  }
  const nota = Math.round((acertos / perguntas.length) * 100)
  const notaCorteStr = await getConfig('funil_nota_corte', aluno.tenant_id, adminClient)
  const notaCorte = parseInt(notaCorteStr ?? '70', 10)

  await (adminClient.from('alunos') as any)
    .update({ funil_respostas: respostas, funil_nota_quiz: nota })
    .eq('id', aluno.id)

  if (nota >= notaCorte) {
    await concluirFunil(aluno, instancia, adminClient)
    return
  }

  // Reprovado — reiniciar quiz
  await (adminClient.from('alunos') as any)
    .update({ funil_pergunta_atual: 0, funil_respostas: [] })
    .eq('id', aluno.id)

  await enviarWhatsApp(
    aluno.whatsapp,
    `Voce acertou ${acertos} de ${perguntas.length} (${nota}%). ` +
    `A nota minima e ${notaCorte}%. Vamos tentar novamente!\n\n` +
    formatarPergunta(perguntas[0], 0, perguntas.length),
    instancia,
  )
}

async function concluirFunil(
  aluno: AlunoFunil,
  instancia: string | null | undefined,
  adminClient: AdminClient,
) {
  const linkSouth = await getConfig('funil_link_south', aluno.tenant_id, adminClient)
  await (adminClient.from('alunos') as any)
    .update({ funil_estado: 4, funil_concluido_em: new Date().toISOString() })
    .eq('id', aluno.id)
  await enviarWhatsApp(
    aluno.whatsapp,
    `Parabens, ${aluno.nome.split(' ')[0]}! Voce concluiu o processo de integracao com sucesso.\n\n` +
    `*Proximo passo:* acesse o link abaixo para se cadastrar no sistema South e retirar sua carteirinha e certificado:\n\n` +
    `${linkSouth ?? '[link nao configurado]'}\n\n` +
    `Seja bem-vindo ao time!`,
    instancia,
  )
  log.info('funil concluido', { alunoId: aluno.id })
}

export async function iniciarFunil(
  alunoId: string,
  instancia: string | null | undefined,
  adminClient: AdminClient,
): Promise<{ ok: boolean; erro?: string }> {
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, tenant_id, funil_estado')
    .eq('id', alunoId)
    .maybeSingle() as { data: { id: string; nome: string; whatsapp: string; tenant_id: string | null; funil_estado: number } | null }

  if (!aluno) return { ok: false, erro: 'Consultor nao encontrado' }
  if (aluno.funil_estado === 4) return { ok: false, erro: 'Funil ja concluido para este consultor' }

  await (adminClient.from('alunos') as any)
    .update({ funil_estado: 1, funil_pergunta_atual: 0, funil_respostas: [], funil_iniciado_em: new Date().toISOString(), funil_nota_quiz: null, funil_concluido_em: null })
    .eq('id', alunoId)

  const nome = aluno.nome.split(' ')[0]
  await enviarWhatsApp(
    aluno.whatsapp,
    `Ola, ${nome}! Temos uma oportunidade especial para voce.\n\n` +
    `Voce pode se tornar um *Consultor Integrado*, com acesso a carteirinha, certificado e o sistema South.\n\n` +
    `Gostaria de saber mais?\n\nResponda *Sim* ou *Nao*.`,
    instancia,
  )

  return { ok: true }
}

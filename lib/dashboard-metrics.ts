// Lógica pura (sem I/O) de cálculo das métricas do dashboard admin.
// Isolada aqui para ser testável e para garantir que funil e progresso médio
// usem exatamente o mesmo universo de aulas e a mesma contagem (aulas
// DISTINTAS concluídas por aluno — nunca linhas da tabela de progresso).

export type AulaComModulo = {
  id: string
  modulo?: { ordem?: number | null; perfis_permitidos?: unknown } | null
}

/** Aulas liberadas para o perfil 'consultor' (as que o aluno efetivamente vê). */
export function filtrarAulasConsultor(aulas: AulaComModulo[]): AulaComModulo[] {
  return (aulas ?? []).filter((a) => {
    const perfis = a.modulo?.perfis_permitidos ?? []
    return Array.isArray(perfis) && perfis.includes('consultor')
  })
}

/**
 * IDs das aulas do "Módulo 1" = módulo de menor `ordem` entre os do perfil
 * consultor. Retorna lista vazia quando não há aulas (Módulo 1 não configurado).
 */
export function aulasDoModulo1(aulasConsultor: AulaComModulo[]): string[] {
  if (!aulasConsultor || aulasConsultor.length === 0) return []
  const mod1Ordem = Math.min(...aulasConsultor.map((a) => a.modulo?.ordem ?? 999))
  const ids: string[] = []
  for (const a of aulasConsultor) {
    if ((a.modulo?.ordem ?? 999) === mod1Ordem) ids.push(a.id)
  }
  return ids
}

export type FunilMod1 = {
  nuncaAbriu: number
  cursandoMod1: number
  concluiuMod1: number
  mod1Configurado: boolean
}

/**
 * Classifica cada aluno em: nunca abriu / cursando / concluiu Módulo 1.
 * `progressoPorAluno` deve mapear alunoId -> Set de aula_id DISTINTAS aprovadas.
 */
export function calcularFunilMod1(
  idsAlunos: string[],
  progressoPorAluno: Record<string, Set<string>>,
  aulasMod1: string[]
): FunilMod1 {
  const mod1Configurado = aulasMod1.length > 0
  let nuncaAbriu = 0
  let cursandoMod1 = 0
  let concluiuMod1 = 0
  for (const id of idsAlunos) {
    const feito = progressoPorAluno[id]
    if (!feito || feito.size === 0) {
      nuncaAbriu++
    } else if (mod1Configurado && aulasMod1.every((aid) => feito.has(aid))) {
      concluiuMod1++
    } else {
      cursandoMod1++
    }
  }
  return { nuncaAbriu, cursandoMod1, concluiuMod1, mod1Configurado }
}

/** Quantas aulas do universo consultor um aluno concluiu (distintas). */
export function contarAulasConsultorConcluidas(
  feito: Set<string> | undefined,
  aulasConsultorSet: Set<string>
): number {
  if (!feito) return 0
  let n = 0
  for (const aid of feito) if (aulasConsultorSet.has(aid)) n++
  return n
}

export type ProgressoAtivos = {
  mediaProgresso: number
  concluiuMasNaoMarcado: number
}

/**
 * Progresso médio dos alunos ativos usando o MESMO universo do funil.
 * Denominador = nº de aulas do perfil consultor (nunca o total geral de aulas).
 * `concluiuMasNaoMarcado` = ativos que concluíram todas as aulas do perfil.
 */
export function calcularProgressoAtivos(
  idsAtivos: string[],
  progressoPorAluno: Record<string, Set<string>>,
  aulasConsultorSet: Set<string>
): ProgressoAtivos {
  if (idsAtivos.length === 0) return { mediaProgresso: 0, concluiuMasNaoMarcado: 0 }
  const denom = aulasConsultorSet.size || 1
  const soma = idsAtivos.reduce((s, id) => {
    const n = contarAulasConsultorConcluidas(progressoPorAluno[id], aulasConsultorSet)
    return s + Math.min(100, Math.round((n / denom) * 100))
  }, 0)
  const mediaProgresso = Math.round(soma / idsAtivos.length)
  let concluiuMasNaoMarcado = 0
  if (aulasConsultorSet.size > 0) {
    concluiuMasNaoMarcado = idsAtivos.filter(
      (id) => contarAulasConsultorConcluidas(progressoPorAluno[id], aulasConsultorSet) >= aulasConsultorSet.size
    ).length
  }
  return { mediaProgresso, concluiuMasNaoMarcado }
}

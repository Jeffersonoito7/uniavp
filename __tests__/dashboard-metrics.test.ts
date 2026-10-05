import {
  filtrarAulasConsultor,
  aulasDoModulo1,
  calcularFunilMod1,
  contarAulasConsultorConcluidas,
  calcularProgressoAtivos,
  type AulaComModulo,
} from '@/lib/dashboard-metrics'

describe('filtrarAulasConsultor', () => {
  it('mantém apenas aulas de módulos liberados para consultor', () => {
    const aulas: AulaComModulo[] = [
      { id: 'a1', modulo: { ordem: 1, perfis_permitidos: ['consultor'] } },
      { id: 'a2', modulo: { ordem: 1, perfis_permitidos: ['gestor'] } },
      { id: 'a3', modulo: { ordem: 2, perfis_permitidos: ['consultor', 'gestor'] } },
      { id: 'a4', modulo: { ordem: 2, perfis_permitidos: null } },
    ]
    expect(filtrarAulasConsultor(aulas).map((a) => a.id)).toEqual(['a1', 'a3'])
  })

  it('não quebra com entrada vazia/indefinida', () => {
    expect(filtrarAulasConsultor([])).toEqual([])
    expect(filtrarAulasConsultor(undefined as any)).toEqual([])
  })
})

describe('aulasDoModulo1', () => {
  it('retorna as aulas do módulo de menor ordem', () => {
    const consultor: AulaComModulo[] = [
      { id: 'a1', modulo: { ordem: 2, perfis_permitidos: ['consultor'] } },
      { id: 'a2', modulo: { ordem: 1, perfis_permitidos: ['consultor'] } },
      { id: 'a3', modulo: { ordem: 1, perfis_permitidos: ['consultor'] } },
    ]
    expect(aulasDoModulo1(consultor).sort()).toEqual(['a2', 'a3'])
  })

  it('BUG #3: retorna lista vazia (não Infinity) quando não há aulas de consultor', () => {
    expect(aulasDoModulo1([])).toEqual([])
  })
})

describe('calcularFunilMod1', () => {
  const aulasMod1 = ['m1a', 'm1b']

  it('classifica nunca abriu / cursando / concluiu corretamente', () => {
    const prog: Record<string, Set<string>> = {
      aluno_nunca: new Set(),
      aluno_cursando: new Set(['m1a']),
      aluno_concluiu: new Set(['m1a', 'm1b', 'extra']),
    }
    const ids = ['aluno_nunca', 'aluno_cursando', 'aluno_concluiu', 'aluno_sem_registro']
    const r = calcularFunilMod1(ids, prog, aulasMod1)
    expect(r).toEqual({ nuncaAbriu: 2, cursandoMod1: 1, concluiuMod1: 1, mod1Configurado: true })
  })

  it('BUG #3: Módulo 1 não configurado => ninguém é "concluiu"; quem tem progresso vira cursando', () => {
    const prog: Record<string, Set<string>> = {
      a: new Set(['x']),
      b: new Set(),
    }
    const r = calcularFunilMod1(['a', 'b'], prog, [])
    expect(r.mod1Configurado).toBe(false)
    expect(r.concluiuMod1).toBe(0) // não há vacuous-truth marcando todos como concluídos
    expect(r.cursandoMod1).toBe(1)
    expect(r.nuncaAbriu).toBe(1)
  })
})

describe('contarAulasConsultorConcluidas (BUG #4: aulas distintas, não linhas)', () => {
  const universo = new Set(['a1', 'a2', 'a3'])

  it('conta apenas aulas do universo e sem duplicar (é Set)', () => {
    const feito = new Set(['a1', 'a2', 'fora_do_universo'])
    expect(contarAulasConsultorConcluidas(feito, universo)).toBe(2)
  })

  it('retorna 0 para aluno sem progresso', () => {
    expect(contarAulasConsultorConcluidas(undefined, universo)).toBe(0)
  })
})

describe('calcularProgressoAtivos (BUG #5: denominador = universo consultor)', () => {
  it('usa o total de aulas do perfil consultor como denominador', () => {
    const universo = new Set(['a1', 'a2', 'a3', 'a4']) // 4 aulas
    const prog: Record<string, Set<string>> = {
      ativo1: new Set(['a1', 'a2']), // 2/4 = 50%
      ativo2: new Set(['a1', 'a2', 'a3', 'a4']), // 100%
    }
    const r = calcularProgressoAtivos(['ativo1', 'ativo2'], prog, universo)
    expect(r.mediaProgresso).toBe(75) // (50 + 100) / 2
    expect(r.concluiuMasNaoMarcado).toBe(1) // só ativo2 completou tudo
  })

  it('progresso de aula fora do universo NÃO infla o numerador', () => {
    const universo = new Set(['a1', 'a2'])
    const prog: Record<string, Set<string>> = {
      ativo1: new Set(['a1', 'extra1', 'extra2']), // só a1 conta => 1/2 = 50%
    }
    const r = calcularProgressoAtivos(['ativo1'], prog, universo)
    expect(r.mediaProgresso).toBe(50)
    expect(r.concluiuMasNaoMarcado).toBe(0)
  })

  it('não divide por zero quando não há ativos', () => {
    expect(calcularProgressoAtivos([], {}, new Set(['a1']))).toEqual({
      mediaProgresso: 0,
      concluiuMasNaoMarcado: 0,
    })
  })

  it('progresso é limitado a 100% por aluno', () => {
    const universo = new Set(['a1', 'a2'])
    const prog: Record<string, Set<string>> = { ativo1: new Set(['a1', 'a2']) }
    const r = calcularProgressoAtivos(['ativo1'], prog, universo)
    expect(r.mediaProgresso).toBe(100)
  })
})

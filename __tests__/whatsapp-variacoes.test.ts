import { variacoesWhatsapp } from '@/lib/whatsapp'

// Helper: compara ignorando ordem
const asSet = (arr: string[]) => new Set(arr)

describe('variacoesWhatsapp', () => {
  it('entrada vazia/indefinida => lista vazia', () => {
    expect(variacoesWhatsapp('')).toEqual([])
    expect(variacoesWhatsapp(null)).toEqual([])
    expect(variacoesWhatsapp(undefined)).toEqual([])
    expect(variacoesWhatsapp('   ')).toEqual([])
  })

  it('limpa máscara/caracteres não numéricos', () => {
    const v = variacoesWhatsapp('+55 (11) 98765-4321')
    for (const s of v) expect(s).toMatch(/^\d+$/)
    expect(asSet(v).has('5511987654321')).toBe(true)
  })

  it('celular COM DDI (13 díg) gera forma com e sem DDI, com e sem 9º dígito', () => {
    const v = asSet(variacoesWhatsapp('5511987654321'))
    expect(v.has('5511987654321')).toBe(true)
    expect(v.has('11987654321')).toBe(true)
    expect(v.has('551187654321')).toBe(true)
    expect(v.has('1187654321')).toBe(true)
  })

  it('BUG: celular SEM DDI (11 díg) também gera a variação COM DDI', () => {
    const v = asSet(variacoesWhatsapp('11987654321'))
    expect(v.has('11987654321')).toBe(true)
    expect(v.has('5511987654321')).toBe(true)
    expect(v.has('1187654321')).toBe(true)
    expect(v.has('551187654321')).toBe(true)
  })

  it('número legado SEM 9º dígito (10 díg) gera também a forma COM o 9', () => {
    const v = asSet(variacoesWhatsapp('1187654321'))
    expect(v.has('1187654321')).toBe(true)
    expect(v.has('11987654321')).toBe(true)
    expect(v.has('551187654321')).toBe(true)
    expect(v.has('5511987654321')).toBe(true)
  })

  it('garante matching cruzado: todas as formas de um mesmo número compartilham variações', () => {
    const formatos = ['5511987654321', '11987654321', '1187654321', '551187654321']
    const conjuntos = formatos.map(f => variacoesWhatsapp(f))
    for (const entrada of formatos) {
      for (const vars of conjuntos) {
        expect(vars).toContain(entrada)
      }
    }
  })

  it('não retorna duplicatas', () => {
    const v = variacoesWhatsapp('5511987654321')
    expect(v.length).toBe(new Set(v).size)
  })

  it('número fora do padrão BR não quebra (retorna ao menos as formas base)', () => {
    const v = asSet(variacoesWhatsapp('123'))
    expect(v.has('123')).toBe(true)
    expect(v.has('55123')).toBe(true)
  })
})

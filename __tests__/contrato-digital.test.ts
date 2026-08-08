import {
  renderizarTemplate,
  calcularHash,
  calcularHashFinal,
  gerarTokenAssinante,
} from '@/lib/contrato-digital'

describe('renderizarTemplate()', () => {
  it('substitui variaveis corretamente', () => {
    const resultado = renderizarTemplate('Ola {{nome}}, seu plano e {{plano}}.', {
      nome: 'Jefferson',
      plano: 'PRO',
    })
    expect(resultado).toBe('Ola Jefferson, seu plano e PRO.')
  })

  it('nao altera texto sem variaveis', () => {
    const texto = 'Contrato simples sem substituicoes.'
    expect(renderizarTemplate(texto, {})).toBe(texto)
  })

  it('ignora variaveis nao fornecidas (mantém placeholder)', () => {
    const resultado = renderizarTemplate('Ola {{nome}} e {{sobrenome}}.', { nome: 'Ana' })
    expect(resultado).toBe('Ola Ana e {{sobrenome}}.')
  })
})

describe('calcularHash()', () => {
  it('retorna string hex de 64 caracteres (SHA-256)', () => {
    const hash = calcularHash('conteudo de teste')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })

  it('mesmo conteudo produz mesmo hash', () => {
    const conteudo = 'mesmo texto'
    expect(calcularHash(conteudo)).toBe(calcularHash(conteudo))
  })

  it('conteudos diferentes produzem hashes diferentes', () => {
    expect(calcularHash('texto A')).not.toBe(calcularHash('texto B'))
  })
})

describe('calcularHashFinal()', () => {
  it('incorpora corpo e assinantes na composicao e retorna SHA-256', () => {
    const corpo = calcularHash('contrato assinado')
    const assinantes = [{ nome: 'Ana', ip_assinatura: '1.2.3.4', assinatura_url: 'url', assinado_em: '2026-01-01' }]
    const resultado = calcularHashFinal(corpo, assinantes)
    expect(resultado).toHaveLength(64)
    expect(resultado).toMatch(/^[0-9a-f]+$/)
  })

  it('assinantes diferentes geram hash final diferente', () => {
    const corpo = calcularHash('mesmo contrato')
    const h1 = calcularHashFinal(corpo, [{ nome: 'Ana', ip_assinatura: '1.1.1.1' }])
    const h2 = calcularHashFinal(corpo, [{ nome: 'Joao', ip_assinatura: '2.2.2.2' }])
    expect(h1).not.toBe(h2)
  })
})

describe('gerarTokenAssinante()', () => {
  it('retorna token nao vazio e data de expiracao no futuro', () => {
    const { token, expira } = gerarTokenAssinante()
    expect(token).toBeTruthy()
    expect(token.length).toBeGreaterThan(16)
    expect(expira.getTime()).toBeGreaterThan(Date.now())
  })

  it('gera tokens unicos em chamadas consecutivas', () => {
    const t1 = gerarTokenAssinante().token
    const t2 = gerarTokenAssinante().token
    expect(t1).not.toBe(t2)
  })
})

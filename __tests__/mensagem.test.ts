import { getMensagem, MENSAGENS_PADRAO } from '@/lib/mensagem'

// ── Mock do Supabase ────────────────────────────────────────────────────────

function makeAdminClient(rows: { chave: string; texto: string }[] = []) {
  const query = {
    select: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: rows }),
  }
  return { from: jest.fn().mockReturnValue(query) } as any
}

// Limpa o módulo entre testes para resetar o cache interno
beforeEach(() => {
  jest.resetModules()
})

describe('getMensagem', () => {
  it('retorna texto padrão quando não há override no banco', async () => {
    const admin = makeAdminClient([])
    const resultado = await getMensagem('cadastro_boas_vindas', { nomePlataforma: 'TestPlat', alunoNome: 'Ana', appUrl: 'https://x.com' }, admin, null)
    expect(resultado).toContain('Ana')
    expect(resultado).toContain('TestPlat')
    expect(resultado).toContain('https://x.com')
  })

  it('substitui variáveis corretamente', async () => {
    const admin = makeAdminClient([])
    const resultado = await getMensagem('sequencia_dia1', {
      alunoNome: 'Carlos',
      appUrl: 'https://app.test',
      whatsapp: '5511999999999',
      gestorNome: 'Joao',
    }, admin, null)
    expect(resultado).toContain('Carlos')
    expect(resultado).toContain('https://app.test')
    expect(resultado).toContain('Joao')
  })

  it('usa override do tenant quando existe no banco', async () => {
    const textoCustom = 'Ola {alunoNome}, bem-vindo ao nosso sistema!'
    const admin = makeAdminClient([{ chave: 'cadastro_boas_vindas', texto: textoCustom }])
    const resultado = await getMensagem('cadastro_boas_vindas', { alunoNome: 'Bia' }, admin, 'tenant-123')
    expect(resultado).toBe('Ola Bia, bem-vindo ao nosso sistema!')
  })

  it('mantém placeholder quando variável não é fornecida', async () => {
    const admin = makeAdminClient([])
    const resultado = await getMensagem('sequencia_dia1', { alunoNome: 'Leo' }, admin, null)
    expect(resultado).toContain('{appUrl}')
  })

  it('retorna a chave como fallback quando chave não existe', async () => {
    const admin = makeAdminClient([])
    const resultado = await getMensagem('chave_inexistente', {}, admin, null)
    expect(resultado).toBe('chave_inexistente')
  })

  it('não quebra quando o banco retorna erro', async () => {
    const queryComErro = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockRejectedValue(new Error('DB down')),
    }
    const admin = { from: jest.fn().mockReturnValue(queryComErro) } as any
    const resultado = await getMensagem('cadastro_boas_vindas', { nomePlataforma: 'X', alunoNome: 'Y', appUrl: 'Z' }, admin, null)
    expect(resultado).toContain('Y')
  })

  it('todos os textos padrão têm pelo menos 10 caracteres', () => {
    for (const [chave, texto] of Object.entries(MENSAGENS_PADRAO)) {
      expect(texto.length).toBeGreaterThanOrEqual(10)
      expect(typeof texto).toBe('string')
      expect(chave.length).toBeGreaterThan(0)
    }
  })
})

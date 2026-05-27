import { audit, getIp } from '@/lib/audit'

const mockInsert = jest.fn()
jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: () => ({
    from: () => ({ insert: mockInsert }),
  }),
}))

describe('audit()', () => {
  beforeEach(() => {
    mockInsert.mockResolvedValue({ error: null })
  })

  it('insere o registro com os campos corretos', async () => {
    await audit({
      acao: 'aluno.criado',
      entidade: 'alunos',
      entidade_id: 'abc-123',
      tenant_id: 'tenant-1',
      usuario_tipo: 'sistema',
      dados_novos: { nome: 'Fulano' },
    })

    expect(mockInsert).toHaveBeenCalledTimes(1)
    const payload = mockInsert.mock.calls[0][0]
    expect(payload.acao).toBe('aluno.criado')
    expect(payload.entidade).toBe('alunos')
    expect(payload.entidade_id).toBe('abc-123')
    expect(payload.dados_novos).toEqual({ nome: 'Fulano' })
    expect(payload.usuario_tipo).toBe('sistema')
  })

  it('nunca lança exceção mesmo quando Supabase falha', async () => {
    mockInsert.mockRejectedValue(new Error('DB offline'))
    await expect(audit({ acao: 'auth.login', entidade: 'auth.users' })).resolves.not.toThrow()
  })

  it('preenche campos opcionais com null quando omitidos', async () => {
    await audit({ acao: 'contrato.assinado', entidade: 'contratos' })
    const payload = mockInsert.mock.calls[0][0]
    expect(payload.entidade_id).toBeNull()
    expect(payload.tenant_id).toBeNull()
    expect(payload.usuario_id).toBeNull()
    expect(payload.ip).toBeNull()
  })
})

describe('getIp()', () => {
  it('extrai o primeiro IP do header x-forwarded-for', () => {
    const req = { headers: { get: (k: string) => k === 'x-forwarded-for' ? '1.2.3.4, 5.6.7.8' : null } }
    expect(getIp(req)).toBe('1.2.3.4')
  })

  it('usa x-real-ip como fallback', () => {
    const req = { headers: { get: (k: string) => k === 'x-real-ip' ? '9.9.9.9' : null } }
    expect(getIp(req)).toBe('9.9.9.9')
  })

  it('retorna null quando nenhum header está presente', () => {
    const req = { headers: { get: () => null } }
    expect(getIp(req)).toBeNull()
  })
})

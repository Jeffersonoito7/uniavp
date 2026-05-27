import { processarPixTxid } from '@/lib/pix-processor'

// ── Mocks externos ──────────────────────────────────────────────────────────

const mockConsultarPagamento = jest.fn()
jest.mock('@/lib/efi', () => ({
  consultarPagamento: (...args: unknown[]) => mockConsultarPagamento(...args),
}))

const mockEnviarWhatsApp = jest.fn()
jest.mock('@/lib/whatsapp', () => ({
  enviarWhatsApp: (...args: unknown[]) => mockEnviarWhatsApp(...args),
  getInstanciaTenant: jest.fn().mockResolvedValue(null),
}))

jest.mock('@/lib/get-app-url', () => ({
  getAppUrl: jest.fn().mockResolvedValue('https://app.test'),
}))

const mockAudit = jest.fn()
jest.mock('@/lib/audit', () => ({
  audit: (...args: unknown[]) => mockAudit(...args),
}))

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeEmptyClient() {
  const emptyTable = () => ({
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null }),
    single: jest.fn().mockResolvedValue({ data: null }),
  })
  return {
    from: () => emptyTable(),
  } as unknown as ReturnType<typeof import('@/lib/supabase-server').createServiceRoleClient>
}

// ── Testes ──────────────────────────────────────────────────────────────────

describe('processarPixTxid()', () => {
  beforeEach(() => {
    mockConsultarPagamento.mockResolvedValue({ pago: true })
    mockEnviarWhatsApp.mockResolvedValue(undefined)
    mockAudit.mockResolvedValue(undefined)
  })

  it('retorna processado:false quando a Efí não confirma pagamento', async () => {
    mockConsultarPagamento.mockResolvedValue({ pago: false })
    const result = await processarPixTxid('txid-001', makeEmptyClient())
    expect(result.processado).toBe(false)
    expect(result.motivo).toBe('pagamento_nao_confirmado')
  })

  it('retorna processado:false quando txid não existe em nenhuma tabela', async () => {
    const result = await processarPixTxid('txid-inexistente', makeEmptyClient())
    expect(result.processado).toBe(false)
    expect(result.motivo).toBe('txid_nao_encontrado')
  })

  it('processa cobrança SaaS e retorna processado:true', async () => {
    const clienteData = {
      id: 'cli-1', nome: 'Empresa X', contato_whatsapp: '5511999990000',
      status_pagamento: 'em_dia', observacoes: null,
    }

    // Cada chamada a from() cria um objeto novo — simula o comportamento real do cliente Supabase
    let cobrancaQueryCount = 0
    const adminClient = {
      from: (table: string) => {
        if (table === 'cobrancas') {
          cobrancaQueryCount++
          if (cobrancaQueryCount === 1) {
            // Primeira chamada: busca cobrança pelo txid
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'cob-1', cliente_id: 'cli-1', valor: '99.90' },
              }),
            }
          }
          // Segunda chamada: update atômico — retorna 1 linha (processou com sucesso)
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({ data: [{ id: 'cob-1' }] }),
          }
        }
        if (table === 'clientes') {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: clienteData }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null }),
        }
      },
    } as unknown as ReturnType<typeof import('@/lib/supabase-server').createServiceRoleClient>

    const result = await processarPixTxid('txid-cob', adminClient)
    expect(result.processado).toBe(true)
    expect(mockAudit).toHaveBeenCalledWith(expect.objectContaining({
      acao: 'pagamento.confirmado',
      entidade: 'cobrancas',
    }))
  })

  it('processa pagamento de gestor e retorna processado:true', async () => {
    let gestorPagQueryCount = 0
    const adminClient = {
      from: (table: string) => {
        if (table === 'cobrancas') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
          }
        }
        if (table === 'gestor_pagamentos') {
          gestorPagQueryCount++
          if (gestorPagQueryCount === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'gp-1', gestor_id: 'g-1', valor: '79.90' },
              }),
            }
          }
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({ data: [{ id: 'gp-1' }] }),
          }
        }
        if (table === 'gestores') {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'g-1', nome: 'Maria', whatsapp: '5511988880000', ativo: true, status_assinatura: 'ativo', tenant_id: null },
            }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null }),
        }
      },
    } as unknown as ReturnType<typeof import('@/lib/supabase-server').createServiceRoleClient>

    const result = await processarPixTxid('txid-gestor', adminClient)
    expect(result.processado).toBe(true)
    expect(mockAudit).toHaveBeenCalledWith(expect.objectContaining({
      acao: 'pagamento.confirmado',
      entidade: 'gestor_pagamentos',
    }))
  })

  it('propaga exceções para que o chamador possa registrar erro', async () => {
    mockConsultarPagamento.mockRejectedValue(new Error('Efí offline'))
    await expect(processarPixTxid('txid-fail', makeEmptyClient())).rejects.toThrow('Efí offline')
  })
})

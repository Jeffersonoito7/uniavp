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

const mockCreditarCreditos = jest.fn().mockResolvedValue(150)
const mockGarantirRegistro = jest.fn().mockResolvedValue(undefined)
jest.mock('@/lib/agente-creditos', () => ({
  creditarCreditos: (...args: unknown[]) => mockCreditarCreditos(...args),
  garantirRegistroCredito: (...args: unknown[]) => mockGarantirRegistro(...args),
}))

const mockConcederBoasVindas = jest.fn().mockResolvedValue(undefined)
jest.mock('@/lib/pro-agente', () => ({
  concederCreditosBoasVindas: (...args: unknown[]) => mockConcederBoasVindas(...args),
  processarMensagemPRO: jest.fn().mockResolvedValue(null),
}))

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeEmptyClient() {
  const emptyTable = () => ({
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockResolvedValue({ data: null }),
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
              // ativo:true, status_assinatura:'ativo' — não aciona eraUpgrade nem concederCreditosBoasVindas
              data: { id: 'g-1', nome: 'Maria', whatsapp: '5511988880000', ativo: true, status_assinatura: 'ativo', tenant_id: null },
            }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          upsert: jest.fn().mockResolvedValue({ data: null }),
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

  it('retorna ja_processado quando cobrança SaaS já foi paga (update retorna 0 linhas)', async () => {
    let cobrancaQueryCount = 0
    const adminClient = {
      from: (table: string) => {
        if (table === 'cobrancas') {
          cobrancaQueryCount++
          if (cobrancaQueryCount === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'cob-dup', cliente_id: 'cli-1', valor: '99.90' },
              }),
            }
          }
          // Update atômico retorna array vazio — outro processo já processou
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({ data: [] }),
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

    const result = await processarPixTxid('txid-dup', adminClient)
    expect(result.processado).toBe(true)
    expect(result.motivo).toBe('ja_processado')
    // Não deve ter chamado audit nem WhatsApp para pagamento duplicado
    expect(mockAudit).not.toHaveBeenCalled()
    expect(mockEnviarWhatsApp).not.toHaveBeenCalled()
  })

  it('retorna ja_processado quando pagamento de gestor já foi processado', async () => {
    let gestorPagCount = 0
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
          gestorPagCount++
          if (gestorPagCount === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'gp-dup', gestor_id: 'g-2', valor: '79.90' },
              }),
            }
          }
          // Update retorna vazio — já processado
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({ data: [] }),
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

    const result = await processarPixTxid('txid-gest-dup', adminClient)
    expect(result.processado).toBe(true)
    expect(result.motivo).toBe('ja_processado')
    expect(mockAudit).not.toHaveBeenCalled()
  })

  it('processa recarga de créditos do agente IA', async () => {
    let recargaCount = 0
    const adminClient = {
      from: (table: string) => {
        if (table === 'cobrancas' || table === 'gestor_pagamentos') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
          }
        }
        if (table === 'agente_recargas') {
          recargaCount++
          if (recargaCount === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'rec-1', gestor_id: 'g-3', tenant_id: null, creditos: 100, valor: '49.90' },
              }),
            }
          }
          // Update atômico — processa com sucesso
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({ data: [{ id: 'rec-1' }] }),
          }
        }
        if (table === 'gestores') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { whatsapp: '5511977770000', nome: 'João', tenant_id: null },
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

    const result = await processarPixTxid('txid-recarga', adminClient)
    expect(result.processado).toBe(true)
    expect(mockAudit).toHaveBeenCalledWith(expect.objectContaining({
      acao: 'agente.recarga_confirmada',
      entidade: 'agente_recargas',
    }))
  })

  it('não envia WhatsApp quando gestor não tem número cadastrado', async () => {
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
                data: { id: 'gp-semfone', gestor_id: 'g-semfone', valor: '79.90' },
              }),
            }
          }
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({ data: [{ id: 'gp-semfone' }] }),
          }
        }
        if (table === 'gestores') {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            // Gestor sem WhatsApp cadastrado
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'g-semfone', nome: 'Carlos', whatsapp: null, ativo: false, status_assinatura: 'pendente_upgrade', tenant_id: null },
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

    const result = await processarPixTxid('txid-semfone', adminClient)
    expect(result.processado).toBe(true)
    expect(mockEnviarWhatsApp).not.toHaveBeenCalled()
    // Audit ainda deve ser chamado mesmo sem WhatsApp
    expect(mockAudit).toHaveBeenCalledWith(expect.objectContaining({
      acao: 'pagamento.confirmado',
      entidade: 'gestor_pagamentos',
    }))
  })
})

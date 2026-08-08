import { enfileirarWhatsApp } from '@/lib/whatsapp'

jest.mock('@/lib/whatsapp', () => {
  const original = jest.requireActual('@/lib/whatsapp')
  return { ...original, enviarWhatsApp: jest.fn() }
})

function makeClient(insertFn = jest.fn().mockResolvedValue({ error: null })) {
  return {
    from: () => ({ insert: insertFn }),
  } as unknown as ReturnType<typeof import('@/lib/supabase-server').createServiceRoleClient>
}

describe('enfileirarWhatsApp()', () => {
  it('insere registro na fila_whatsapp com status pendente', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null })
    const client = makeClient(insertMock)

    await enfileirarWhatsApp('5511999999999', 'Ola!', 'instancia-abc', client, 'tenant-1')

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        numero: '5511999999999',
        mensagem: 'Ola!',
        instancia: 'instancia-abc',
        status: 'pendente',
        tenant_id: 'tenant-1',
      }),
    )
  })

  it('insere sem tenant_id quando nao fornecido', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null })
    const client = makeClient(insertMock)

    await enfileirarWhatsApp('5511888888888', 'Mensagem', null, client)

    const chamado = insertMock.mock.calls[0][0]
    expect(chamado).not.toHaveProperty('tenant_id')
    expect(chamado.instancia).toBeNull()
  })

  it('nao lanca excecao quando insert falha (silencia o erro)', async () => {
    const insertMock = jest.fn().mockRejectedValue(new Error('DB down'))
    const client = makeClient(insertMock)

    await expect(
      enfileirarWhatsApp('5511777777777', 'Teste', 'inst', client, 'tenant-x'),
    ).resolves.toBeUndefined()
  })
})

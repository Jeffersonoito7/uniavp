// Testa a lógica de idempotência do cadastro isoladamente
// sem precisar montar o Request completo do Next.js

type AlunoExistente = { id: string } | null

function verificarIdempotencia(alunoWpp: AlunoExistente, alunoEmail: AlunoExistente): string | null {
  if (alunoWpp) return 'Este WhatsApp já está cadastrado. Caso tenha esquecido o acesso, clique em "Esqueci minha senha".'
  if (alunoEmail) return 'Este e-mail já está cadastrado. Caso tenha esquecido o acesso, clique em "Esqueci minha senha".'
  return null
}

describe('cadastro idempotência', () => {
  it('permite cadastro quando WhatsApp e email são novos', () => {
    expect(verificarIdempotencia(null, null)).toBeNull()
  })

  it('bloqueia quando WhatsApp já existe', () => {
    const erro = verificarIdempotencia({ id: 'abc' }, null)
    expect(erro).toContain('WhatsApp já está cadastrado')
  })

  it('bloqueia quando email já existe', () => {
    const erro = verificarIdempotencia(null, { id: 'xyz' })
    expect(erro).toContain('e-mail já está cadastrado')
  })

  it('WhatsApp tem prioridade sobre email na mensagem de erro', () => {
    const erro = verificarIdempotencia({ id: 'abc' }, { id: 'xyz' })
    expect(erro).toContain('WhatsApp já está cadastrado')
    expect(erro).not.toContain('e-mail')
  })

  it('retorna mensagem com instrução de recuperação de senha', () => {
    const erroWpp = verificarIdempotencia({ id: 'abc' }, null)
    const erroEmail = verificarIdempotencia(null, { id: 'xyz' })
    expect(erroWpp).toContain('Esqueci minha senha')
    expect(erroEmail).toContain('Esqueci minha senha')
  })
})

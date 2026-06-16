export function traduzirErro(error: { message?: string } | null | undefined): string {
  const msg = error?.message ?? ''

  if (msg.includes('already been registered') || msg.includes('already registered') || msg.includes('already exists'))
    return 'Este email já está cadastrado na plataforma'
  if (msg.includes('duplicate key') || msg.includes('unique constraint'))
    return 'Este registro já existe'
  if (msg.includes('foreign key constraint') || msg.includes('violates foreign key'))
    return 'Não é possível realizar esta operação pois o registro está vinculado a outros dados'
  if (msg.includes('null value in column') || msg.includes('not-null constraint'))
    return 'Campo obrigatório não preenchido'
  if (msg.includes('value too long') || msg.includes('character varying'))
    return 'Valor digitado é muito longo para este campo'
  if (msg.includes('invalid input syntax') || msg.includes('invalid uuid'))
    return 'Formato de dado inválido'
  if (msg.includes('permission denied'))
    return 'Sem permissão para realizar esta operação'
  if (msg.includes('Invalid login credentials'))
    return 'Email ou senha incorretos'
  if (msg.includes('Email not confirmed'))
    return 'Email não confirmado'
  if (msg.includes('User not found'))
    return 'Usuário não encontrado'
  if (msg.includes('JWT') || msg.includes('token'))
    return 'Sessão inválida ou expirada'
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Erro de conexão. Tente novamente'
  if (msg.includes('timeout'))
    return 'Operação demorou muito. Tente novamente'

  return 'Erro interno. Tente novamente mais tarde'
}

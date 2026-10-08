import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { variacoesWhatsapp } from '@/lib/whatsapp'
import { rateLimit, LIMITS } from '@/lib/rate-limit'
import { getIp } from '@/lib/audit'
import { createLogger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const log = createLogger('recuperar-questionario')

/**
 * Recuperação de senha por QUESTIONÁRIO, 100% dentro do app (sem link externo).
 *
 * O usuário confirma e-mail + telefone; se baterem com o cadastro, a senha é
 * redefinida na hora. É um fator de verificação FRACO (e-mail/telefone não são
 * segredo) — adotado por decisão explícita do produto: a plataforma não tem
 * valor pecuniário e o conteúdo das aulas é público (YouTube), então o risco de
 * account takeover foi aceito conscientemente em troca da conveniência.
 *
 * Mitigações mantidas mesmo assim:
 *  - rate limit por IP (evita força bruta de combinações e-mail/telefone)
 *  - resposta genérica (não revela se o e-mail existe — anti-enumeração)
 *  - normalização de telefone (casa com/sem DDI e com/sem 9º dígito)
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getIp(req)
    const rl = await rateLimit(`recuperar-questionario:${ip}`, LIMITS.otp)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      )
    }

    const body = await req.json()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const telefone = String(body?.telefone ?? '')
    const novaSenha = String(body?.novaSenha ?? '')

    if (!email || !telefone || !novaSenha) {
      return NextResponse.json({ error: 'Preencha e-mail, telefone e a nova senha.' }, { status: 400 })
    }
    if (novaSenha.length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
    }

    const telVariacoes = variacoesWhatsapp(telefone)
    if (telVariacoes.length === 0) {
      return NextResponse.json({ error: 'Telefone inválido.' }, { status: 400 })
    }

    const adminClient = createServiceRoleClient()

    // Mensagem genérica reutilizada em todos os caminhos de falha de verificação,
    // para não revelar se o e-mail existe nem qual campo não bateu.
    const erroGenerico = 'Não encontramos uma conta com esses dados. Verifique o e-mail e o telefone.'

    // Procura a conta por e-mail em alunos e, se não achar, em gestores.
    // Ambas as tabelas têm user_id/email/whatsapp. Admins ficam de fora de
    // propósito (escopo definido: apenas alunos e gestores).
    const [{ data: aluno }, { data: gestor }] = await Promise.all([
      adminClient.from('alunos').select('id, user_id, email, whatsapp').eq('email', email).maybeSingle(),
      adminClient.from('gestores').select('id, user_id, email, whatsapp').eq('email', email).maybeSingle(),
    ])

    // Pode haver conta de aluno E de gestor com o mesmo e-mail. Considera as
    // candidatas e aceita aquela cujo telefone cadastrado confere com o digitado.
    type Candidata = { id: string; user_id: string | null; whatsapp: string | null; tipo: 'aluno' | 'gestor' }
    const candidatas: Candidata[] = []
    if (aluno) candidatas.push({ ...(aluno as any), tipo: 'aluno' })
    if (gestor) candidatas.push({ ...(gestor as any), tipo: 'gestor' })

    if (candidatas.length === 0) {
      log.warn('tentativa de recuperação: email não encontrado', { ip })
      return NextResponse.json({ error: erroGenerico }, { status: 400 })
    }

    const conta = candidatas.find(c =>
      variacoesWhatsapp(c.whatsapp).some(t => telVariacoes.includes(t))
    )
    if (!conta) {
      log.warn('tentativa de recuperação: telefone não confere', { ip })
      return NextResponse.json({ error: erroGenerico }, { status: 400 })
    }
    const tipoConta = conta.tipo

    const userId = conta.user_id
    if (!userId) {
      return NextResponse.json(
        { error: 'Sua conta ainda não tem acesso ativado. Peça ao seu gestor para usar "Reenviar Acesso".' },
        { status: 400 }
      )
    }

    // Dados conferem → redefine a senha diretamente (service role).
    const { error: errSenha } = await adminClient.auth.admin.updateUserById(userId, { password: novaSenha })
    if (errSenha) {
      log.error('falha ao atualizar senha no questionário', { err: errSenha.message, tipo: tipoConta, contaId: conta.id })
      return NextResponse.json({ error: 'Erro ao redefinir a senha. Tente novamente.' }, { status: 500 })
    }

    log.info('senha redefinida via questionário', { tipo: tipoConta, contaId: conta.id })
    return NextResponse.json({ ok: true })
  } catch (e) {
    log.error('erro inesperado em recuperar-questionario', { err: String(e) })
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}

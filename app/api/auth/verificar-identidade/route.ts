import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

function normalizar(tel: string): string {
  return tel.replace(/\D/g, '')
}

function telefonesBatem(a: string, b: string): boolean {
  const na = normalizar(a)
  const nb = normalizar(b)
  // Compara os últimos 9 dígitos para cobrir variações de DDI/DDD
  return na.slice(-9) === nb.slice(-9) && na.slice(-9).length >= 8
}

export async function POST(req: NextRequest) {
  const { email, telefone } = await req.json()
  if (!email || !telefone) {
    return NextResponse.json({ error: 'E-mail e telefone são obrigatórios.' }, { status: 400 })
  }

  const adminClient = createServiceRoleClient()
  const emailLower = email.toLowerCase().trim()

  // Verifica nas três tabelas de usuários
  const [{ data: aluno }, { data: gestor }, { data: admin }] = await Promise.all([
    adminClient.from('alunos').select('whatsapp').ilike('email', emailLower).maybeSingle(),
    adminClient.from('gestores').select('whatsapp').ilike('email', emailLower).maybeSingle(),
    adminClient.from('admins').select('whatsapp').ilike('email', emailLower).maybeSingle(),
  ])

  const telefoneNaBase = aluno?.whatsapp || gestor?.whatsapp || admin?.whatsapp

  if (!telefoneNaBase) {
    // Não expõe se o e-mail existe ou não
    return NextResponse.json({ erro: 'dados_nao_conferem' }, { status: 422 })
  }

  if (!telefonesBatem(telefoneNaBase, telefone)) {
    return NextResponse.json({ erro: 'dados_nao_conferem' }, { status: 422 })
  }

  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('arquivo') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<{ nome: string; whatsapp: string; email: string; senha: string }>(ws)

  let importados = 0
  const erros: { linha: number; motivo: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const linha = i + 2

    if (!row.nome || !row.whatsapp || !row.email || !row.senha) {
      erros.push({ linha, motivo: 'Campos obrigatórios ausentes (nome, whatsapp, email, senha)' })
      continue
    }

    const whatsapp = String(row.whatsapp).replace(/\D/g, '')
    const email = String(row.email).toLowerCase().trim()
    const nome = String(row.nome).trim()
    const senha = String(row.senha)

    const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    })

    if (authErr || !authUser?.user) {
      erros.push({ linha, motivo: authErr?.message ?? 'Erro ao criar usuário' })
      continue
    }

    const { error: alunoErr } = await (adminClient.from('alunos') as any).insert({
      user_id: authUser.user.id,
      nome,
      whatsapp,
      email,
    })

    if (alunoErr) {
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      erros.push({ linha, motivo: alunoErr.message ?? 'Erro ao cadastrar aluno' })
      continue
    }

    importados++
  }

  return NextResponse.json({ importados, erros })
}

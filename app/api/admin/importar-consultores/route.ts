import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Erro ao ler o arquivo enviado' }, { status: 400 })
  }
  const file = formData.get('arquivo') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })

  let buffer: ArrayBuffer
  let wb: XLSX.WorkBook
  try {
    buffer = await file.arrayBuffer()
    wb = XLSX.read(buffer, { type: 'array' })
  } catch {
    return NextResponse.json({ error: 'Arquivo inválido ou corrompido' }, { status: 400 })
  }
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<{ nome: string; whatsapp: string; email: string; senha: string; gestor_nome?: string; gestor_whatsapp?: string }>(ws)

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

    const gestorNome = row.gestor_nome ? String(row.gestor_nome).trim() : null
    const gestorWpp = row.gestor_whatsapp ? String(row.gestor_whatsapp).replace(/\D/g, '') : null

    const { error: alunoErr } = await adminClient.from('alunos').insert({
      user_id: authUser.user.id,
      nome,
      whatsapp,
      email,
      ...(gestorNome && { gestor_nome: gestorNome }),
      ...(gestorWpp && { gestor_whatsapp: gestorWpp }),
      ...(ctx.tenantId ? { tenant_id: ctx.tenantId } : {}),
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

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const [{ data: adminRecord }, { data: superRecord }] = await Promise.all([
    adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
    adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
  ])
  if (!adminRecord && !superRecord) return NextResponse.json({ error: 'Nao autorizado.' }, { status: 403 })

  const { id } = await params
  const tid = (adminRecord?.tenant_id ?? null) as string | null
  const body = await req.json()
  const { nome, whatsapp, email, cpf, status, plano, plano_vencimento } = body as {
    nome: string; whatsapp: string; email: string; cpf: string | null
    status: string; plano: 'PRO' | 'Free'; plano_vencimento: string | null
  }

  // Verificar que o aluno pertence ao tenant
  let qAluno = adminClient.from('alunos').select('id, user_id').eq('id', id)
  if (tid) qAluno = (qAluno as any).eq('tenant_id', tid)
  const { data: aluno, error: erroAluno } = await (qAluno as any).maybeSingle()
  if (erroAluno || !aluno) return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 })

  // Atualizar tabela alunos
  const { error: errUpd } = await adminClient.from('alunos').update({ nome, whatsapp, email, cpf: cpf || null, status }).eq('id', id)
  if (errUpd) return NextResponse.json({ error: errUpd.message }, { status: 500 })

  const userId = (aluno as any).user_id as string | null

  if (userId) {
    if (plano === 'PRO') {
      const { data: gestor } = await adminClient.from('gestores').select('id').eq('user_id', userId).maybeSingle()
      if (gestor) {
        await adminClient.from('gestores').update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: plano_vencimento ?? null }).eq('user_id', userId)
      } else {
        await adminClient.from('gestores').insert({
          user_id: userId, nome, whatsapp, email, ativo: true,
          status_assinatura: 'ativo', plano_vencimento: plano_vencimento ?? null,
          ...(tid ? { tenant_id: tid } : {}),
        } as any)
      }
    } else {
      // Rebaixar para Free
      const { data: gestor } = await adminClient.from('gestores').select('id').eq('user_id', userId).maybeSingle()
      if (gestor) {
        await adminClient.from('gestores').update({ ativo: false, status_assinatura: 'free' }).eq('user_id', userId)
      }
    }
  }

  return NextResponse.json({ ok: true })
}

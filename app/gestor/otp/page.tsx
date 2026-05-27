import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export default async function GestorOtpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=pro')

  const admin = createServiceRoleClient()

  const { data: adminRec } = await admin.from('admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (adminRec) redirect('/admin')

  const { data: gestor } = await admin.from('gestores').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (gestor) redirect('/pro')

  const { data: aluno } = await admin.from('alunos').select('whatsapp').eq('user_id', user.id).maybeSingle()
  if (aluno?.whatsapp) redirect(`/aluno/${aluno.whatsapp}`)

  redirect('/entrar?p=pro')
}

import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import CarteiraDisplay from './CarteiraDisplay'

export default async function CarteiraPage({ params }: { params: { whatsapp: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/consultor/login')

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, status, numero_registro, foto_perfil, data_formacao')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!aluno) redirect('/consultor/login')
  if (aluno.whatsapp !== params.whatsapp) redirect(`/aluno/${aluno.whatsapp}/carteira`)
  if (aluno.status !== 'concluido') redirect(`/aluno/${params.whatsapp}`)

  // Carga horária total dos cursos publicados
  const { data: aulas } = await (adminClient.from('aulas') as any)
    .select('duracao_minutos').eq('publicado', true)
  const totalMin = (aulas ?? []).reduce((s: number, a: { duracao_minutos: number | null }) => s + (a.duracao_minutos ?? 0), 0)
  const horas = Math.floor(totalMin / 60)
  const min = totalMin % 60
  const cargaHoraria = totalMin === 0 ? '—' : horas > 0 ? `${horas}h${min > 0 ? ` ${min}min` : ''}` : `${min} min`

  // Datas
  const baseDate = aluno.data_formacao ? new Date(aluno.data_formacao + 'T12:00:00') : new Date()
  const dataFormacao = baseDate.toLocaleDateString('pt-BR')
  const validadeDate = new Date(baseDate)
  validadeDate.setFullYear(validadeDate.getFullYear() + 2)
  const validade = aluno.data_formacao ? validadeDate.toLocaleDateString('pt-BR') : '—'
  const turma = String(baseDate.getFullYear())

  const numRegistro = String(aluno.numero_registro ?? 1001).padStart(6, '0')

  return (
    <CarteiraDisplay
      nome={aluno.nome}
      numRegistro={numRegistro}
      fotoUrl={aluno.foto_perfil ?? null}
      dataFormacao={dataFormacao}
      validade={validade}
      cargaHoraria={cargaHoraria}
      turma={turma}
      whatsapp={aluno.whatsapp}
      status={aluno.status}
    />
  )
}

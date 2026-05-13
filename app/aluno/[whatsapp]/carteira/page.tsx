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

  // Configurações da carteira
  const { data: cfgRows } = await (adminClient.from('configuracoes') as any)
    .select('chave, valor')
    .in('chave', ['site_nome', 'site_logo_url', 'carteira_assinatura_nome', 'carteira_assinatura_cargo', 'carteira_assinatura_empresa', 'carteira_url_verificacao', 'carteira_tagline'])
  const cfg: Record<string, string> = {}
  for (const r of cfgRows ?? []) { try { cfg[r.chave] = JSON.parse(r.valor) } catch { cfg[r.chave] = r.valor } }

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
      empresaNome={cfg['site_nome'] || 'UNIVERSIDADE'}
      empresaLogoUrl={cfg['site_logo_url'] || null}
      assinaturaNome={cfg['carteira_assinatura_nome'] || 'Assinatura'}
      assinaturaCargo={cfg['carteira_assinatura_cargo'] || 'PRESIDENTE'}
      assinaturaEmpresa={cfg['carteira_assinatura_empresa'] || cfg['site_nome'] || ''}
      urlVerificacao={cfg['carteira_url_verificacao'] || ''}
      tagline={cfg['carteira_tagline'] || ''}
    />
  )
}

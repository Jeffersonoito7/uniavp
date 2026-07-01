export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import CarteiraDisplay from '@/app/aluno/[whatsapp]/carteira/CarteiraDisplay'

export default async function AdminCarteiraPage({ params }: { params: { whatsapp: string } }) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=adm')

 const adminClient = createServiceRoleClient()
 const { data: adminRecord } = await adminClient.from('admins')
 .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
 if (!adminRecord) redirect('/entrar?p=adm')

 const { data: aluno } = await adminClient.from('alunos')
 .select('id, nome, whatsapp, status, numero_registro, foto_perfil, data_formacao, cpf')
 .eq('whatsapp', params.whatsapp)
 .maybeSingle()

 if (!aluno) redirect('/admin/consultores')

 const baseDate = aluno.data_formacao ? new Date(aluno.data_formacao + 'T12:00:00') : new Date()
 const dataFormacao = baseDate.toLocaleDateString('pt-BR')
 const validadeDate = new Date(baseDate)
 validadeDate.setFullYear(validadeDate.getFullYear() + 2)
 const validade = aluno.data_formacao ? validadeDate.toLocaleDateString('pt-BR') : '—'
 const turma = String(baseDate.getFullYear())

 const numRegistro = String(aluno.numero_registro ?? 1001).padStart(6, '0')
 const rawCpf = (aluno.cpf ?? '').replace(/\D/g, '')
 const cpf = rawCpf.length === 11
   ? `${rawCpf.slice(0,3)}.${rawCpf.slice(3,6)}.${rawCpf.slice(6,9)}-${rawCpf.slice(9)}`
   : rawCpf || '—'

 const { data: cfgRows } = await adminClient.from('configuracoes')
 .select('chave, valor')
 .in('chave', ['site_nome', 'site_logo_url', 'carteira_assinatura_nome', 'carteira_assinatura_cargo', 'carteira_assinatura_empresa', 'carteira_url_verificacao', 'carteira_tagline', 'carteira_logo_esquerda', 'carteira_logo_direita', 'carteira_assinatura_url'])
 const cfg: Record<string, string> = {}
 for (const r of cfgRows ?? []) { try { cfg[r.chave] = JSON.parse(String(r.valor)) } catch { cfg[r.chave] = String(r.valor) } }

 return (
 <CarteiraDisplay
 nome={aluno.nome}
 numRegistro={numRegistro}
 fotoUrl={aluno.foto_perfil ?? null}
 dataFormacao={dataFormacao}
 validade={validade}
 cpf={cpf}
 turma={turma}
 whatsapp={aluno.whatsapp}
 status={aluno.status}
 empresaNome={cfg['site_nome'] || 'UNIVERSIDADE'}
 empresaLogoUrl={cfg['site_logo_url'] || null}
 assinaturaNome={cfg['carteira_assinatura_nome'] || 'Presidente'}
 assinaturaCargo={cfg['carteira_assinatura_cargo'] || 'PRESIDENTE'}
 assinaturaEmpresa={cfg['carteira_assinatura_empresa'] || cfg['site_nome'] || ''}
 assinaturaUrl={cfg['carteira_assinatura_url'] || null}
 urlVerificacao={cfg['carteira_url_verificacao'] || process.env.NEXT_PUBLIC_APP_URL || ''}
 tagline={cfg['carteira_tagline'] || ''}
 logoEsquerdaUrl={cfg['carteira_logo_esquerda'] || null}
 logoDireitaUrl={cfg['carteira_logo_direita'] || null}
 />
 )
}

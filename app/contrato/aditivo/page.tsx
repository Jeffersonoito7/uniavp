import { redirect } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import { headers } from 'next/headers'
import AditivoForm from './AditivoForm'

export const dynamic = 'force-dynamic'

export default async function AditivoPage({ searchParams }: { searchParams?: { wpp?: string } }) {
 const wpp = searchParams?.wpp?.replace(/\D/g, '') ?? ''
 if (!wpp) redirect('/contrato')

 const host = (await headers()).get('host') ?? ''
 const adminClient = createServiceRoleClient()
 const siteConfig = await getSiteConfig(host)

 const { data: contrato } = await adminClient.from('contratos')
 .select('numero_registro, nome, clausulas_aceitas')
 .eq('whatsapp', wpp).maybeSingle()

 if (!contrato) redirect('/contrato')

 // Se ja nao esta pendente (sem_cnpj = false), nao faz sentido o aditivo
 const semCnpj = (contrato.clausulas_aceitas as Record<string, unknown> | null)?.sem_cnpj
 if (!semCnpj) redirect('/contrato')

 const { data: cfgs } = await adminClient.from('configuracoes')
 .select('chave, valor')
 .in('chave', ['contrato_cor_fundo','contrato_cor_principal'])
 const cfgMap: Record<string, string> = {}
 for (const c of cfgs ?? []) cfgMap[c.chave] = typeof c.valor === 'string' ? c.valor : ''

 const bg = cfgMap['contrato_cor_fundo'] || 'linear-gradient(135deg,#0a1628 0%,#0d1f3c 50%,#0a1628 100%)'
 const cor = cfgMap['contrato_cor_principal'] || '#6366f1'

 return (
 <AditivoForm
 contratanteNome={siteConfig.nome}
 contratoNome={contrato.nome}
 contratoNumero={contrato.numero_registro ?? ''}
 whatsapp={wpp}
 bg={bg}
 cor={cor}
 />
 )
}

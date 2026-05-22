import { createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import { headers } from 'next/headers'
import ContratoForm from './ContratoForm'

export const dynamic = 'force-dynamic'

export default async function ContratoPage({ searchParams }: { searchParams?: { nome?: string; whatsapp?: string; email?: string; cpf?: string; aluno_id?: string } }) {
  const host = (await headers()).get('host') ?? ''
  const adminClient = createServiceRoleClient()
  const siteConfig = await getSiteConfig(host)

  const { data: cfgs } = await (adminClient.from('configuracoes') as any)
    .select('chave, valor')
    .in('chave', ['contrato_contratante_nome','contrato_contratante_cnpj','contrato_contratante_endereco','contrato_representante_nome','contrato_representante_cargo','contrato_foro'])
  const cfgMap: Record<string,string> = {}
  for (const c of cfgs ?? []) cfgMap[c.chave] = typeof c.valor === 'string' ? c.valor : JSON.stringify(c.valor ?? '').replace(/"/g,'')

  return (
    <ContratoForm
      nomeInicial={searchParams?.nome ?? ''}
      whatsappInicial={searchParams?.whatsapp ?? ''}
      emailInicial={searchParams?.email ?? ''}
      cpfInicial={searchParams?.cpf ?? ''}
      alunoId={searchParams?.aluno_id ?? undefined}
      contratanteNome={cfgMap['contrato_contratante_nome'] || siteConfig.nome}
      contratanteCnpj={cfgMap['contrato_contratante_cnpj'] || ''}
      contratanteEndereco={cfgMap['contrato_contratante_endereco'] || ''}
      foro={cfgMap['contrato_foro'] || 'Petrolina/PE'}
    />
  )
}

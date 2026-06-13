import { getSiteConfig } from '@/lib/site-config'
import { headers } from 'next/headers'
import CNCPVForm from './CNCPVForm'

export default async function CNCPVPage({ searchParams }: { searchParams?: { nome?: string; whatsapp?: string; email?: string; cpf?: string } }) {
 const host = (await headers()).get('host') ?? ''
 const config = await getSiteConfig(host)
 return (
 <CNCPVForm
 siteNome={config.nome}
 logoUrl={config.logoPaginaUrl || config.logoUrl}
 nomeInicial={searchParams?.nome ?? ''}
 whatsappInicial={searchParams?.whatsapp ?? ''}
 emailInicial={searchParams?.email ?? ''}
 cpfInicial={searchParams?.cpf ?? ''}
 />
 )
}

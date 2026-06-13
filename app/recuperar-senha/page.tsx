import { getSiteConfig } from '@/lib/site-config'
import { headers } from 'next/headers'
import RecuperarSenhaForm from './RecuperarSenhaForm'

export default async function RecuperarSenhaPage() {
 const host = (await headers()).get('host') ?? ''
 const config = await getSiteConfig(host)
 return (
 <RecuperarSenhaForm
 logoUrl={config.logoPaginaUrl || config.logoUrl }
 siteNome={config.isDominioMaster ? '' : config.nome}
 />
 )
}

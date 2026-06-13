import { getSiteConfig } from '@/lib/site-config'
import { headers } from 'next/headers'
import RedefinirSenhaForm from './RedefinirSenhaForm'

export default async function RedefinirSenhaPage() {
 const host = (await headers()).get('host') ?? ''
 const config = await getSiteConfig(host)
 return (
 <RedefinirSenhaForm
 logoUrl={config.logoPaginaUrl || config.logoUrl }
 siteNome={config.isDominioMaster ? '' : config.nome}
 />
 )
}

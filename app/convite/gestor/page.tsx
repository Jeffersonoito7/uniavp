export const dynamic = 'force-dynamic'
import { getSiteConfig } from '@/lib/site-config'
import { headers } from 'next/headers'
import ConviteGestorForm from './ConviteGestorForm'

export default async function ConviteGestorPage() {
 const host = (await headers()).get('host') ?? ''
 const config = await getSiteConfig(host)
 return (
 <ConviteGestorForm
 siteNome={config.nome}
 logoUrl={config.logoPaginaUrl || config.logoUrl}
 />
 )
}

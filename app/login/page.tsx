import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getSiteConfig } from '@/lib/site-config'
import { DOMINIO_MASTER } from '@/lib/constants'
import LoginForm from './LoginForm'

export default async function LoginPage() {
 const headersList = headers()
 const host = headersList.get('host')?.replace(/:\d+$/, '') ?? ''

 // Domínio master não tem login de empresa — manda direto pro super login
 if (host === DOMINIO_MASTER) {
 redirect('/super/login')
 }

 const config = await getSiteConfig(host)
 return (
 <LoginForm
 logoUrl={config.logoPaginaUrl || config.logoUrl}
 siteNome={config.nome}
 isDominioMaster={config.isDominioMaster}
 whatsappSuporte={config.whatsappSuporte}
 />
 )
}

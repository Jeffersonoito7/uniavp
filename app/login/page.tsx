import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getSiteConfig } from '@/lib/site-config'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const headersList = headers()
  const host = headersList.get('host')?.replace(/:\d+$/, '') ?? ''

  // Domínio master não tem login de empresa — manda direto pro super login
  if (host === 'universidade.oito7digital.com.br') {
    redirect('/super/login')
  }

  const config = await getSiteConfig()
  return (
    <LoginForm
      logoUrl={config.logoPaginaUrl || config.logoUrl || '/logo.png'}
      siteNome={config.nome}
      isDominioMaster={config.isDominioMaster}
    />
  )
}

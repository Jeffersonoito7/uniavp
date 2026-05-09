import { getSiteConfig } from '@/lib/site-config'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const config = await getSiteConfig()
  return (
    <LoginForm
      logoUrl={config.logoPaginaUrl || config.logoUrl || '/logo.png'}
      siteNome={config.isDominioMaster ? '' : config.nome}
    />
  )
}

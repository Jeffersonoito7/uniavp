import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import GestorLoginForm from './GestorLoginForm'

export default async function GestorLoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Se já tem sessão, vai direto para o gestor (page.tsx vai verificar se é gestor)
  if (user) redirect('/gestor')

  const siteConfig = await getSiteConfig()
  return <GestorLoginForm logoUrl={siteConfig.logoUrl} siteNome={siteConfig.nome} />
}

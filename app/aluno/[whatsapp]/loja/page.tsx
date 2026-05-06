import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import Link from 'next/link'
import LojaCliente from './LojaCliente'

export default async function LojaPage({ params }: { params: { whatsapp: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any).select('id, nome, whatsapp').eq('user_id', user.id).maybeSingle()
  if (!aluno) redirect('/login')
  if (aluno.whatsapp !== params.whatsapp) redirect(`/aluno/${aluno.whatsapp}/loja`)

  const { data: pontosRows } = await (adminClient.from('aluno_pontos') as any).select('quantidade').eq('aluno_id', aluno.id)
  const saldo = (pontosRows ?? []).reduce((s: number, r: { quantidade: number }) => s + r.quantidade, 0)

  const { data: premios } = await (adminClient.from('premios') as any).select('*').eq('ativo', true).order('custo_pontos')
  const { data: resgates } = await (adminClient.from('resgates') as any)
    .select('*, premio:premios(nome)')
    .eq('aluno_id', aluno.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/aluno/${params.whatsapp}`} style={{ color: 'var(--avp-text-dim)', fontSize: 14, textDecoration: 'none' }}>← Início</Link>
        <span style={{ fontWeight: 800, fontSize: 16 }}>Loja de Prêmios</span>
        <div style={{ background: 'var(--avp-green)', color: '#fff', borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 700 }}>
          {saldo} pontos
        </div>
      </header>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <LojaCliente saldoInicial={saldo} premios={premios ?? []} resgatesIniciais={resgates ?? []} whatsapp={params.whatsapp} />
      </div>
    </div>
  )
}

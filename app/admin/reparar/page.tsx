import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { vincularAlunosDoGestorNoFree } from '@/lib/pix-processor'
import AdminLayout from '../AdminLayout'

export const dynamic = 'force-dynamic'

export default async function RepararPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=adm')

  const adminClient = createServiceRoleClient()

  // Aceita admin de tenant OU super admin
  const [{ data: adminRec }, { data: superRec }] = await Promise.all([
    adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
    adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
  ])
  if (!adminRec && !superRec) redirect('/entrar?p=adm')

  const tid = adminRec?.tenant_id ?? null

  // Reparo de pagamentos (fase 1: travados, fase 2: pendentes na EFI)
  const reparo = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/admin/reparar-gestores`, {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? ''}` },
  }).then(r => r.json()).catch(() => ({ ok: false, reparados: 0, detalhes: [], mensagem: 'Erro ao chamar reparo.' }))

  const reparados: string[] = (reparo.detalhes ?? []).filter((d: string) => d.startsWith('OK')).map((d: string) => d.replace(/^OK /, ''))
  const erros: string[] = (reparo.detalhes ?? []).filter((d: string) => d.startsWith('ERRO')).map((d: string) => d.replace(/^ERRO /, ''))

  // Conta pendentes para informar
  const { count: totalPendentes } = await adminClient.from('gestor_pagamentos')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pendente')
    .not('txid', 'is', null)

  // Normalizacao de whatsapp: puxa alunos do FREE para o painel PRO correto
  let gq = adminClient.from('gestores').select('id, nome, whatsapp, ativo')
  if (tid) gq = gq.eq('tenant_id', tid)
  const { data: gestores } = await gq

  let alunosVinculados = 0
  const vinculosDetalhes: string[] = []

  for (const gestor of gestores ?? []) {
    try {
      const { atualizados } = await vincularAlunosDoGestorNoFree(gestor.whatsapp, gestor.nome, adminClient)
      if (atualizados > 0) {
        alunosVinculados += atualizados
        vinculosDetalhes.push(`${gestor.nome}: ${atualizados} aluno(s) vinculados`)
      }
    } catch { /* silencioso */ }
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 600 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Reparar Sistema</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 28 }}>
          Verifica e corrige pagamentos travados e alunos desvinculados de PROs.
        </p>

        {/* Secao: pagamentos */}
        <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--avp-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Pagamentos PRO</p>

        {reparados.length > 0 ? (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <p style={{ color: '#4ade80', fontWeight: 800, fontSize: 15, marginBottom: 10 }}>
              {reparados.length} conta{reparados.length > 1 ? 's reparadas' : ' reparada'}
            </p>
            {reparados.map((r, i) => (
              <p key={i} style={{ color: '#4ade80', fontSize: 13, margin: '3px 0' }}>{r}</p>
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>
              {(totalPendentes ?? 0) > 0
                ? `Nenhum caso detectado. ${totalPendentes} pagamento(s) ainda nao confirmados pela EFI.`
                : 'Nenhum pagamento pendente. Tudo certo.'}
            </p>
          </div>
        )}

        {erros.length > 0 && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <p style={{ color: '#f87171', fontWeight: 700, marginBottom: 6 }}>Erros nos pagamentos:</p>
            {erros.map((e, i) => (
              <p key={i} style={{ color: '#f87171', fontSize: 13, margin: '3px 0' }}>{e}</p>
            ))}
          </div>
        )}

        {/* Secao: alunos do FREE → PRO */}
        <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--avp-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, marginTop: 28 }}>
          Alunos do FREE para o PRO
        </p>

        {alunosVinculados > 0 ? (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <p style={{ color: '#4ade80', fontWeight: 800, fontSize: 15, marginBottom: 10 }}>
              {alunosVinculados} aluno{alunosVinculados > 1 ? 's corrigidos' : ' corrigido'} e vinculado{alunosVinculados > 1 ? 's' : ''} ao PRO correto
            </p>
            {vinculosDetalhes.map((d, i) => (
              <p key={i} style={{ color: '#4ade80', fontSize: 13, margin: '3px 0' }}>{d}</p>
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>
              Nenhum aluno com formato de whatsapp incorreto encontrado. Todos vinculados corretamente.
            </p>
          </div>
        )}

        <a href="/admin/reparar" style={{ display: 'inline-block', background: '#f59e0b', color: '#000', borderRadius: 8, padding: '10px 24px', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
          Verificar novamente
        </a>
        {' '}
        <a href="/admin" style={{ display: 'inline-block', color: 'var(--avp-text-dim)', fontSize: 14, textDecoration: 'underline', marginLeft: 12 }}>
          Voltar ao admin
        </a>
      </div>
    </AdminLayout>
  )
}

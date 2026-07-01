import { createServiceRoleClient } from '@/lib/supabase-server'
import AssinaturaDigital from './AssinaturaDigital'

export const dynamic = 'force-dynamic'

export default async function AssinarContratoPage({ params }: { params: { token: string } }) {
  const adminClient = createServiceRoleClient()

  const { data: assinante } = await adminClient
    .from('contrato_assinantes')
    .select('id, nome, email, cpf, papel, status, token_expira_em, contrato_id')
    .eq('token_acesso', params.token)
    .maybeSingle()

  if (!assinante) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 420, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Link inválido</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Este link de assinatura não existe ou foi revogado. Entre em contato com o administrador.</p>
        </div>
      </div>
    )
  }

  if (assinante.token_expira_em && new Date(assinante.token_expira_em) < new Date()) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 420, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⏰</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Link expirado</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Este link de assinatura expirou. Solicite um novo link ao administrador.</p>
        </div>
      </div>
    )
  }

  const { data: contrato } = await adminClient
    .from('contratos_digitais')
    .select('id, titulo, numero_registro, corpo_renderizado, status')
    .eq('id', assinante.contrato_id)
    .maybeSingle()

  if (!contrato || contrato.status === 'cancelado') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 420, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚫</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Contrato cancelado</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Este contrato foi cancelado. Entre em contato com o administrador.</p>
        </div>
      </div>
    )
  }

  if (assinante.status === 'pendente') {
    await adminClient.from('contrato_assinantes').update({ status: 'visualizado' }).eq('id', assinante.id)
  }

  return (
    <AssinaturaDigital
      token={params.token}
      nomeAssinante={assinante.nome}
      emailAssinante={assinante.email}
      cpfAssinante={assinante.cpf}
      tituloContrato={contrato.titulo}
      numeroRegistro={contrato.numero_registro}
      corpoHtml={contrato.corpo_renderizado ?? ''}
      jaAssinou={assinante.status === 'assinado'}
      precisaPreencher={!assinante.nome}
    />
  )
}

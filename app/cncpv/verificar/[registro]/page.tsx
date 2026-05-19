import { createServiceRoleClient } from '@/lib/supabase-server'

export default async function VerificarCNCPVPage({ params }: { params: { registro: string } }) {
  const adminClient = createServiceRoleClient()
  const { data } = await (adminClient.from('cncpv_assinaturas') as any)
    .select('nome, numero_registro, assinado_em, cpf, whatsapp')
    .eq('numero_registro', params.registro)
    .maybeSingle()

  const valido = !!data
  const bg = 'linear-gradient(135deg, #020d1a 0%, #03183a 60%, #021a0e 100%)'

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <div style={{ background: 'rgba(10,22,40,0.85)', border: `2px solid ${valido ? 'rgba(2,161,83,0.5)' : 'rgba(230,57,70,0.5)'}`, borderRadius: 20, padding: 40, backdropFilter: 'blur(12px)' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{valido ? '✅' : '❌'}</div>

          <p style={{ fontWeight: 900, fontSize: 28, color: '#02A153', letterSpacing: 3, margin: '0 0 8px' }}>CNCPV</p>

          {valido ? (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#22c55e', marginBottom: 24 }}>Carteira Válida</h1>
              <div style={{ background: 'rgba(2,161,83,0.08)', border: '1px solid rgba(2,161,83,0.2)', borderRadius: 12, padding: '20px 24px', textAlign: 'left', marginBottom: 20 }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Consultor</p>
                <p style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 16px' }}>{data.nome}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Nº de Registro</p>
                <p style={{ color: '#02A153', fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>{data.numero_registro}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Data de Emissão</p>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0 }}>
                  {new Date(data.assinado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                {['✓ ÉTICO', '✓ HABILITADO', '✓ CERTIFICADO'].map(s => (
                  <span key={s} style={{ background: 'rgba(2,161,83,0.15)', border: '1px solid rgba(2,161,83,0.3)', color: '#02A153', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>{s}</span>
                ))}
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f87171', marginBottom: 16 }}>Registro não encontrado</h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7 }}>
                O número <strong style={{ color: '#fff' }}>{params.registro}</strong> não corresponde a nenhuma carteira CNCPV emitida.
              </p>
            </>
          )}

          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 24 }}>
            Carteira Nacional do Consultor de Proteção Veicular
          </p>
        </div>
      </div>
    </div>
  )
}

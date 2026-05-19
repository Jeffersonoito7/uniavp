import { createServiceRoleClient } from '@/lib/supabase-server'

export default async function VerificarCNCPVPage({ params }: { params: { registro: string } }) {
  const adminClient = createServiceRoleClient()
  const { data } = await (adminClient.from('cncpv_assinaturas') as any)
    .select('nome, numero_registro, assinado_em, cpf, hash_contrato, pdf_url, status, revogado_em, revogado_motivo')
    .eq('numero_registro', params.registro)
    .maybeSingle()

  const valido = !!data
  const revogada = data?.status === 'revogada'
  const bg = 'linear-gradient(135deg, #020d1a 0%, #03183a 60%, #021a0e 100%)'

  const corBorda = revogada ? 'rgba(230,57,70,0.5)' : valido ? 'rgba(2,161,83,0.5)' : 'rgba(230,57,70,0.5)'
  const icone = revogada ? '🚫' : valido ? '✅' : '❌'

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>
        <div style={{ background: 'rgba(10,22,40,0.9)', border: `2px solid ${corBorda}`, borderRadius: 20, padding: 40, backdropFilter: 'blur(12px)' }}>

          {/* Logo CNCPV */}
          <div style={{ display: 'inline-block', background: 'rgba(2,161,83,0.12)', border: '1px solid rgba(2,161,83,0.3)', borderRadius: 12, padding: '8px 24px', marginBottom: 20 }}>
            <p style={{ fontWeight: 900, fontSize: 22, color: '#02A153', letterSpacing: 3, margin: 0 }}>CNCPV</p>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', letterSpacing: 0.8 }}>CARTEIRA NACIONAL DO CONSULTOR DE PROTEÇÃO VEICULAR</p>
          </div>

          <div style={{ fontSize: 52, marginBottom: 12 }}>{icone}</div>

          {!valido && (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f87171', marginBottom: 16 }}>Registro não encontrado</h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7 }}>
                O número <strong style={{ color: '#fff' }}>{params.registro}</strong> não corresponde a nenhuma carteira CNCPV emitida.
              </p>
            </>
          )}

          {valido && revogada && (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f87171', marginBottom: 16 }}>Carteira Revogada</h1>
              <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 12, padding: '16px 20px', textAlign: 'left', marginBottom: 20 }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Consultor</p>
                <p style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: '0 0 12px' }}>{data.nome}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Nº de Registro</p>
                <p style={{ color: '#f87171', fontSize: 16, fontWeight: 800, margin: '0 0 12px', textDecoration: 'line-through' }}>{data.numero_registro}</p>
                {data.revogado_em && (
                  <>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Revogada em</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '0 0 8px' }}>
                      {new Date(data.revogado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </>
                )}
                {data.revogado_motivo && (
                  <>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Motivo</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>{data.revogado_motivo}</p>
                  </>
                )}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                Esta credencial não é mais válida. Para mais informações, entre em contato com a associação emissora.
              </p>
            </>
          )}

          {valido && !revogada && (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#22c55e', marginBottom: 20 }}>✦ Documento Autêntico</h1>

              <div style={{ background: 'rgba(2,161,83,0.08)', border: '1px solid rgba(2,161,83,0.25)', borderRadius: 12, padding: '20px 24px', textAlign: 'left', marginBottom: 16 }}>
                {[
                  ['Consultor', data.nome],
                  ['Nº de Registro', data.numero_registro],
                  ['Data de Emissão', new Date(data.assinado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })],
                ].map(([l, v]) => (
                  <div key={l} style={{ marginBottom: 14 }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 3px' }}>{l}</p>
                    <p style={{ color: l === 'Nº de Registro' ? '#02A153' : '#fff', fontSize: l === 'Consultor' ? 18 : 15, fontWeight: 800, margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {['✓ ÉTICO', '✓ HABILITADO', '✓ CERTIFICADO', '✓ ATIVO'].map(s => (
                  <span key={s} style={{ background: 'rgba(2,161,83,0.15)', border: '1px solid rgba(2,161,83,0.35)', color: '#02A153', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700 }}>{s}</span>
                ))}
              </div>

              {data.pdf_url && (
                <a href={data.pdf_url} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', color: '#f87171', borderRadius: 10, padding: '12px 20px', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginBottom: 16 }}>
                  📄 Baixar Contrato Assinado (PDF)
                </a>
              )}

              {data.hash_contrato && (
                <div style={{ background: 'rgba(200,165,53,0.06)', border: '1px solid rgba(200,165,53,0.2)', borderRadius: 10, padding: '12px 16px', textAlign: 'left' }}>
                  <p style={{ color: 'rgba(200,165,53,0.8)', fontSize: 9.5, fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>
                    🔐 Hash SHA-256 — Impressão Digital do Contrato
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontFamily: 'monospace', margin: '0 0 8px', wordBreak: 'break-all', lineHeight: 1.7 }}>
                    {data.hash_contrato}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9.5, margin: 0, lineHeight: 1.5 }}>
                    Assinado eletronicamente — MP 2.200-2/2001 · Art. 107 do Código Civil · Lei 14.063/2020
                  </p>
                </div>
              )}
            </>
          )}

          <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10, marginTop: 24 }}>
            cncpv.com.br · Carteira Nacional do Consultor de Proteção Veicular
          </p>
        </div>
      </div>
    </div>
  )
}

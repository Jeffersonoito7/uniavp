'use client'
import { useState, useEffect } from 'react'
import type { PlanoSaaS } from '@/app/api/super/planos/route'

export default function SignupForm({ planos, planoInicial }: { planos: PlanoSaaS[]; planoInicial?: string }) {
  const [etapa, setEtapa] = useState<'plano' | 'dados' | 'pix' | 'aguardando' | 'sucesso'>(planoInicial ? 'dados' : 'plano')
  const [planoId, setPlanoId] = useState(planoInicial || '')
  const [form, setForm] = useState({ nome_empresa: '', contato_nome: '', whatsapp: '', email: '', dominio: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [pixData, setPixData] = useState<{ pix_copia_cola: string; qrcode_base64: string; valor: number; plano_nome: string; cliente_id: string } | null>(null)
  const [copiado, setCopiado] = useState(false)

  const plano = planos.find(p => p.id === planoId)

  // Polling de pagamento
  useEffect(() => {
    if (etapa !== 'aguardando' || !pixData?.cliente_id) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/super/signup?cliente_id=${pixData.cliente_id}`)
      const data = await res.json()
      if (data.ativo) { setEtapa('sucesso'); clearInterval(interval) }
    }, 4000)
    return () => clearInterval(interval)
  }, [etapa, pixData])

  async function handleSubmit() {
    if (!planoId) { setErro('Selecione um plano.'); return }
    if (!form.nome_empresa || !form.contato_nome || !form.whatsapp || !form.email) {
      setErro('Preencha todos os campos obrigatórios.'); return
    }
    setLoading(true); setErro('')
    const res = await fetch('/api/super/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, plano_id: planoId }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setErro(data.error || 'Erro ao processar. Tente novamente.')
      if (res.status === 400 && data.error?.includes('cotação')) {
        // Plano sem preço — redireciona para WhatsApp
      }
      return
    }
    setPixData({ pix_copia_cola: data.pix_copia_cola, qrcode_base64: data.qrcode_base64, valor: data.valor, plano_nome: data.plano_nome, cliente_id: data.cliente_id })
    setEtapa('pix')
  }

  function copiar() {
    if (!pixData) return
    navigator.clipboard.writeText(pixData.pix_copia_cola)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const inp: React.CSSProperties = { width: '100%', background: '#08090d', border: '1px solid #252836', borderRadius: 8, padding: '12px 14px', color: '#f0f1f5', fontSize: 15, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', color: '#8a8fa3', fontSize: 13, marginBottom: 6, fontWeight: 600 }

  return (
    <div style={{ minHeight: '100vh', background: '#08090d', color: '#f0f1f5', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>

      <a href="/landing" style={{ fontSize: 13, color: '#8a8fa3', textDecoration: 'none', marginBottom: 40 }}>← Voltar para o início</a>

      {/* Etapa: Escolher plano */}
      {etapa === 'plano' && (
        <div style={{ width: '100%', maxWidth: 860 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>Escolha seu plano</h1>
          <p style={{ color: '#8a8fa3', textAlign: 'center', marginBottom: 40 }}>Todos incluem suporte por WhatsApp e setup em menos de 24h.</p>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(planos.length, 3)}, 1fr)`, gap: 20, marginBottom: 24 }}>
            {planos.map(p => (
              <div key={p.id} onClick={() => { setPlanoId(p.id); setErro('') }}
                style={{ background: planoId === p.id ? '#6366f115' : '#181b24', border: planoId === p.id ? '2px solid #6366f1' : '1px solid #252836', borderRadius: 14, padding: '28px 22px', cursor: 'pointer', position: 'relative', transition: 'border-color 0.2s' }}>
                {p.destaque && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 20, padding: '3px 14px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>⭐ Popular</div>}
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{p.nome}</h3>
                <p style={{ fontSize: 12, color: '#8a8fa3', marginBottom: 16 }}>{p.descricao}</p>
                <p style={{ fontSize: 28, fontWeight: 900, marginBottom: 16, color: planoId === p.id ? '#6366f1' : '#f0f1f5' }}>
                  {p.preco > 0 ? `R$ ${p.preco.toLocaleString('pt-BR')}/mês` : (p.preco_label || 'Sob consulta')}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {p.recursos.map(r => (
                    <li key={r} style={{ fontSize: 13, color: '#c9cce0', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#02A153', flexShrink: 0 }}>✓</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {erro && <p style={{ color: '#e63946', textAlign: 'center', marginBottom: 12 }}>{erro}</p>}
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => { if (!planoId) { setErro('Selecione um plano.'); return }; setErro(''); setEtapa('dados') }}
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '16px 48px', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Etapa: Dados da associação */}
      {etapa === 'dados' && (
        <div style={{ width: '100%', maxWidth: 520 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 6 }}>Dados da sua associação</h1>
          {plano && <p style={{ color: '#6366f1', textAlign: 'center', marginBottom: 32, fontSize: 14, fontWeight: 600 }}>Plano {plano.nome} · R$ {plano.preco.toLocaleString('pt-BR')}/mês</p>}
          <div style={{ background: '#181b24', border: '1px solid #252836', borderRadius: 14, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={lbl}>Nome da associação *</label>
              <input style={inp} placeholder="Ex: Associação de Consultores XYZ" value={form.nome_empresa} onChange={e => setForm(p => ({ ...p, nome_empresa: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Seu nome (responsável) *</label>
              <input style={inp} placeholder="Nome completo" value={form.contato_nome} onChange={e => setForm(p => ({ ...p, contato_nome: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>WhatsApp *</label>
                <input style={inp} placeholder="(11) 99999-9999" value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>E-mail *</label>
                <input style={inp} type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={lbl}>Domínio personalizado <span style={{ color: '#8a8fa3', fontWeight: 400 }}>(opcional)</span></label>
              <input style={inp} placeholder="Ex: uni.suaassociacao.com.br" value={form.dominio} onChange={e => setForm(p => ({ ...p, dominio: e.target.value }))} />
              <p style={{ fontSize: 12, color: '#8a8fa3', marginTop: 6 }}>Se não tiver domínio próprio, usaremos um subdomínio padrão.</p>
            </div>
            {erro && <p style={{ color: '#e63946', fontSize: 13 }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              {!planoInicial && (
                <button onClick={() => setEtapa('plano')} style={{ flex: 1, background: 'none', border: '1px solid #252836', color: '#8a8fa3', borderRadius: 8, padding: '13px', cursor: 'pointer', fontSize: 14 }}>
                  ← Voltar
                </button>
              )}
              <button onClick={handleSubmit} disabled={loading}
                style={{ flex: 2, background: loading ? '#252836' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '14px', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? '⏳ Aguarde...' : 'Gerar PIX e ativar →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Etapa: PIX */}
      {etapa === 'pix' && pixData && (
        <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Pague para ativar</h1>
          <p style={{ color: '#8a8fa3', marginBottom: 32 }}>Plano {pixData.plano_nome} · R$ {pixData.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>

          {pixData.qrcode_base64 && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, display: 'inline-block', marginBottom: 24 }}>
              <img src={`data:image/png;base64,${pixData.qrcode_base64}`} alt="QR Code PIX" style={{ width: 220, height: 220 }} />
            </div>
          )}

          <div style={{ background: '#181b24', border: '1px solid #252836', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: '#8a8fa3', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>PIX Copia e Cola</p>
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#c9cce0', wordBreak: 'break-all', lineHeight: 1.5, marginBottom: 14 }}>
              {pixData.pix_copia_cola}
            </p>
            <button onClick={copiar} style={{ background: copiado ? '#02A15320' : '#6366f115', border: `1px solid ${copiado ? '#02A153' : '#6366f140'}`, color: copiado ? '#02A153' : '#6366f1', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700, width: '100%' }}>
              {copiado ? '✅ Copiado!' : '📋 Copiar código PIX'}
            </button>
          </div>

          <p style={{ color: '#8a8fa3', fontSize: 13, marginBottom: 20 }}>Após o pagamento, você receberá as credenciais de acesso no WhatsApp automaticamente.</p>

          <button onClick={() => setEtapa('aguardando')}
            style={{ background: '#02A15320', border: '1px solid #02A15340', color: '#02A153', borderRadius: 10, padding: '14px 32px', cursor: 'pointer', fontSize: 14, fontWeight: 700, width: '100%' }}>
            ✅ Já paguei — verificar pagamento
          </button>
        </div>
      )}

      {/* Etapa: Aguardando confirmação */}
      {etapa === 'aguardando' && (
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 24, animation: 'spin 2s linear infinite' }}>⏳</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Verificando pagamento...</h2>
          <p style={{ color: '#8a8fa3', marginBottom: 24 }}>Aguarde. Assim que confirmarmos o pagamento, você receberá um WhatsApp com seus dados de acesso.</p>
          <button onClick={() => setEtapa('pix')} style={{ background: 'none', border: '1px solid #252836', color: '#8a8fa3', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 13 }}>
            ← Voltar ao PIX
          </button>
        </div>
      )}

      {/* Etapa: Sucesso */}
      {etapa === 'sucesso' && (
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 80, marginBottom: 24 }}>🎉</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>Pagamento confirmado!</h1>
          <p style={{ color: '#8a8fa3', fontSize: 16, marginBottom: 32 }}>
            Sua plataforma está sendo configurada. Em instantes você receberá um <strong style={{ color: '#f0f1f5' }}>WhatsApp</strong> com o link de acesso e as credenciais do seu painel admin.
          </p>
          <div style={{ background: '#02A15315', border: '1px solid #02A15340', borderRadius: 12, padding: '20px 24px' }}>
            <p style={{ color: '#02A153', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>✅ O que acontece agora:</p>
            <ol style={{ listStyle: 'none', padding: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Receba as credenciais no WhatsApp', 'Acesse seu painel admin', 'Configure logo, cores e conteúdo', 'Comece a cadastrar seus consultores'].map((s, i) => (
                <li key={i} style={{ color: '#c9cce0', fontSize: 14, display: 'flex', gap: 10 }}>
                  <span style={{ color: '#02A153', fontWeight: 700 }}>{i + 1}.</span> {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

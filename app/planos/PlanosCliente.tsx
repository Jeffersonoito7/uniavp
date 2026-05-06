'use client';
import { useState } from 'react';

const planos = [
  {
    key: 'starter',
    nome: 'STARTER',
    preco: 'R$ 297/mês',
    destaque: false,
    recursos: [
      'Até 50 consultores',
      '3 módulos',
      'Suporte WhatsApp',
      'Domínio próprio',
    ],
  },
  {
    key: 'profissional',
    nome: 'PROFISSIONAL',
    preco: 'R$ 497/mês',
    destaque: true,
    recursos: [
      'Até 200 consultores',
      'Módulos ilimitados',
      'Suporte prioritário',
      'Certificados automáticos',
      'Ranking + Relatórios XLS',
    ],
  },
  {
    key: 'enterprise',
    nome: 'ENTERPRISE',
    preco: 'R$ 997/mês',
    destaque: false,
    recursos: [
      'Consultores ilimitados',
      'Tudo do Profissional',
      'White-label completo',
      'Gerador de questões IA',
      'Suporte dedicado',
    ],
  },
];

function formatCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatTelefone(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export default function PlanosCliente() {
  const [planoSelecionado, setPlanoSelecionado] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState<{ boleto_url?: string; boleto_codigo?: string } | null>(null);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);

  async function gerarBoleto(e: React.FormEvent) {
    e.preventDefault();
    setGerando(true);
    setErro('');
    const resp = await fetch('/api/pagamento/boleto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plano: planoSelecionado, nome, cpf, email, telefone }),
    });
    const data = await resp.json();
    setGerando(false);
    if (resp.ok) setResultado(data);
    else setErro(data.erro || 'Erro ao gerar boleto.');
  }

  function copiarCodigo() {
    if (resultado?.boleto_codigo) {
      navigator.clipboard.writeText(resultado.boleto_codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  function fecharModal() {
    setPlanoSelecionado(null);
    setResultado(null);
    setErro('');
    setNome(''); setCpf(''); setEmail(''); setTelefone('');
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--avp-border)',
    borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14,
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5,
    color: 'var(--avp-text-dim)', marginBottom: 6, fontWeight: 600,
  };

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
        maxWidth: 1000,
        margin: '0 auto',
      }}>
        {planos.map(p => (
          <div
            key={p.key}
            style={{
              background: p.destaque
                ? 'linear-gradient(135deg, rgba(51,54,135,0.25) 0%, rgba(2,161,83,0.15) 100%)'
                : 'var(--avp-card)',
              border: p.destaque ? '1px solid rgba(74,78,170,0.5)' : '1px solid var(--avp-border)',
              borderRadius: 16,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 60px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            }}
          >
            {p.destaque && (
              <div style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--grad-brand)', color: '#fff',
                fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
                padding: '4px 16px', borderRadius: 99,
              }}>
                Mais Popular
              </div>
            )}
            <p style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--avp-text-dim)', margin: '0 0 12px', fontWeight: 700 }}>
              {p.nome}
            </p>
            <p style={{ fontSize: 32, fontWeight: 900, margin: '0 0 24px', color: 'var(--avp-text)' }}>
              {p.preco}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {p.recursos.map(r => (
                <li key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--avp-text)' }}>
                  <span style={{ color: 'var(--avp-green)', fontWeight: 700, fontSize: 16 }}>✓</span>
                  {r}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setPlanoSelecionado(p.key)}
              style={{
                background: p.destaque ? 'var(--grad-brand)' : 'transparent',
                border: p.destaque ? 'none' : '1px solid var(--avp-border)',
                color: 'var(--avp-text)',
                padding: '12px 0',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                letterSpacing: 1,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              Assinar com Boleto
            </button>
          </div>
        ))}
      </div>

      {planoSelecionado && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
        }} onClick={e => { if (e.target === e.currentTarget) fecharModal(); }}>
          <div style={{
            background: 'var(--avp-card)', border: '1px solid var(--avp-border)',
            borderRadius: 20, padding: 40, width: '100%', maxWidth: 480,
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            {resultado ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Boleto Gerado!</h2>
                  <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, margin: 0 }}>Pague até 3 dias úteis para ativar seu plano.</p>
                </div>
                {resultado.boleto_codigo && (
                  <div style={{ background: 'var(--avp-card-hover)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                    <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--avp-text-dim)', margin: '0 0 8px', fontWeight: 600 }}>Código de Barras</p>
                    <p style={{ fontSize: 12, wordBreak: 'break-all', margin: 0, color: 'var(--avp-text)', fontFamily: 'monospace' }}>{resultado.boleto_codigo}</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={copiarCodigo} style={{
                    flex: 1, background: 'var(--avp-card-hover)', border: '1px solid var(--avp-border)',
                    color: 'var(--avp-text)', padding: '12px 0', borderRadius: 10, fontWeight: 600,
                    fontSize: 14, cursor: 'pointer',
                  }}>
                    {copiado ? '✓ Copiado!' : 'Copiar Código'}
                  </button>
                  {resultado.boleto_url && (
                    <a href={resultado.boleto_url} target="_blank" rel="noopener noreferrer" style={{
                      flex: 1, background: 'var(--grad-brand)', color: '#fff',
                      padding: '12px 0', borderRadius: 10, fontWeight: 700,
                      fontSize: 14, textDecoration: 'none', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      Abrir Boleto
                    </a>
                  )}
                </div>
                <button onClick={fecharModal} style={{
                  width: '100%', marginTop: 16, background: 'none', border: 'none',
                  color: 'var(--avp-text-dim)', fontSize: 13, cursor: 'pointer', padding: 8,
                }}>
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={gerarBoleto}>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>
                    Assinar — {planos.find(p => p.key === planoSelecionado)?.nome}
                  </h2>
                  <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: 0 }}>
                    {planos.find(p => p.key === planoSelecionado)?.preco}
                  </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Nome Completo</label>
                  <input required style={inputStyle} value={nome} onChange={e => setNome(e.target.value)} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>CPF</label>
                  <input required style={inputStyle} value={cpf}
                    onChange={e => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>E-mail</label>
                  <input required type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Telefone / WhatsApp</label>
                  <input style={inputStyle} value={telefone}
                    onChange={e => setTelefone(formatTelefone(e.target.value))} placeholder="(00) 00000-0000" />
                </div>

                {erro && (
                  <div style={{
                    background: 'rgba(230,57,70,0.1)', border: '1px solid var(--avp-danger)',
                    color: 'var(--avp-danger)', padding: '10px 14px', borderRadius: 8,
                    fontSize: 13, marginBottom: 16,
                  }}>{erro}</div>
                )}

                <button type="submit" disabled={gerando} className="bg-gradient" style={{
                  width: '100%', color: '#fff', border: 'none', padding: 14,
                  borderRadius: 10, fontWeight: 700, fontSize: 14, letterSpacing: 1,
                  cursor: gerando ? 'not-allowed' : 'pointer', opacity: gerando ? 0.6 : 1,
                }}>
                  {gerando ? 'Gerando Boleto...' : 'Gerar Boleto'}
                </button>
                <button type="button" onClick={fecharModal} style={{
                  width: '100%', marginTop: 12, background: 'none', border: 'none',
                  color: 'var(--avp-text-dim)', fontSize: 13, cursor: 'pointer', padding: 8,
                }}>
                  Cancelar
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

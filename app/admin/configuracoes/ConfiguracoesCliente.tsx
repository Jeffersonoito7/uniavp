'use client';
import { useState } from 'react';
import type { SiteConfig } from '@/app/lib/site-config';

export default function ConfiguracoesCliente({ config }: { config: SiteConfig }) {
  const [nome, setNome] = useState(config.nome);
  const [slogan, setSlogan] = useState(config.slogan);
  const [logoUrl, setLogoUrl] = useState(config.logoUrl);
  const [corPrimaria, setCorPrimaria] = useState(config.corPrimaria);
  const [corSecundaria, setCorSecundaria] = useState(config.corSecundaria);
  const [whatsappSuporte, setWhatsappSuporte] = useState(config.whatsappSuporte);
  const [planosAtivo, setPlanosAtivo] = useState(config.planosAtivo);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMsg('');
    const pares = [
      { chave: 'site_nome', valor: nome },
      { chave: 'site_slogan', valor: slogan },
      { chave: 'site_logo_url', valor: logoUrl },
      { chave: 'site_cor_primaria', valor: corPrimaria },
      { chave: 'site_cor_secundaria', valor: corSecundaria },
      { chave: 'site_whatsapp_suporte', valor: whatsappSuporte },
      { chave: 'planos_ativo', valor: planosAtivo },
    ];
    const resp = await fetch('/api/admin/configuracoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pares),
    });
    const data = await resp.json();
    setSalvando(false);
    if (resp.ok) setMsg('Configurações salvas com sucesso!');
    else setMsg(data.erro || 'Erro ao salvar.');
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5,
    color: 'var(--avp-text-dim)', marginBottom: 6, fontWeight: 600,
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--avp-card-hover)', border: '1px solid var(--avp-border)',
    borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14,
  };
  const fieldStyle: React.CSSProperties = { marginBottom: 20 };

  return (
    <form onSubmit={salvar}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Nome da Plataforma</label>
            <input style={inputStyle} value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Slogan</label>
            <input style={inputStyle} value={slogan} onChange={e => setSlogan(e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>URL da Logo</label>
            <input style={inputStyle} value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="/logo.png" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>WhatsApp Suporte</label>
            <input style={inputStyle} value={whatsappSuporte} onChange={e => setWhatsappSuporte(e.target.value)} placeholder="55119..." />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Habilitar Página de Planos</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="button" onClick={() => setPlanosAtivo(!planosAtivo)} style={{
                width: 48, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer',
                background: planosAtivo ? 'var(--avp-green)' : 'var(--avp-border)',
                position: 'relative', transition: 'background 0.2s',
              }}>
                <span style={{
                  position: 'absolute', top: 3, left: planosAtivo ? 25 : 3,
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </button>
              <span style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>{planosAtivo ? 'Ativo' : 'Inativo'}</span>
            </div>
          </div>
        </div>

        <div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Cor Primária</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="color" value={corPrimaria} onChange={e => setCorPrimaria(e.target.value)}
                style={{ width: 48, height: 40, borderRadius: 8, border: '1px solid var(--avp-border)', cursor: 'pointer', background: 'none', padding: 2 }} />
              <input style={{ ...inputStyle, flex: 1 }} value={corPrimaria} onChange={e => setCorPrimaria(e.target.value)} />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Cor Secundária</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="color" value={corSecundaria} onChange={e => setCorSecundaria(e.target.value)}
                style={{ width: 48, height: 40, borderRadius: 8, border: '1px solid var(--avp-border)', cursor: 'pointer', background: 'none', padding: 2 }} />
              <input style={{ ...inputStyle, flex: 1 }} value={corSecundaria} onChange={e => setCorSecundaria(e.target.value)} />
            </div>
          </div>

          <div style={{
            background: 'var(--avp-card-hover)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20, marginTop: 8,
          }}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--avp-text-dim)', marginBottom: 12, fontWeight: 600 }}>Preview das Cores</p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 48, borderRadius: 8, background: corPrimaria, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>Primária</span>
              </div>
              <div style={{ flex: 1, height: 48, borderRadius: 8, background: corSecundaria, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>Secundária</span>
              </div>
            </div>
            <div style={{
              height: 48, borderRadius: 8,
              background: `linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>Gradiente da Marca</span>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div style={{
          background: msg.includes('sucesso') ? 'rgba(2,161,83,0.1)' : 'rgba(230,57,70,0.1)',
          border: `1px solid ${msg.includes('sucesso') ? 'var(--avp-green)' : 'var(--avp-danger)'}`,
          color: msg.includes('sucesso') ? 'var(--avp-green)' : 'var(--avp-danger)',
          padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
        }}>{msg}</div>
      )}

      <button type="submit" disabled={salvando} style={{
        background: 'var(--grad-brand)', color: '#fff', border: 'none',
        padding: '12px 32px', borderRadius: 10, fontWeight: 700, fontSize: 14,
        cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.6 : 1,
        letterSpacing: 1,
      }}>
        {salvando ? 'Salvando...' : 'Salvar Configurações'}
      </button>
    </form>
  );
}

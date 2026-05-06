'use client';
import { useState } from 'react';

interface Consultor {
  id: string;
  nome: string;
  whatsapp: string;
  email: string;
  status: string;
  created_at: string;
}

export default function ConsultoresCliente({ consultores: inicial, appUrl }: { consultores: Consultor[]; appUrl: string }) {
  const [consultores, setConsultores] = useState(inicial);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ nome: '', whatsapp: '', email: '', senha: '' });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState('');

  const linkCadastro = `${appUrl}/cadastro`;

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--avp-border)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14,
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, textTransform: 'uppercase' as const,
    letterSpacing: 1.5, color: 'var(--avp-text-dim)', marginBottom: 5, fontWeight: 600,
  };

  function copiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(''), 2000);
  }

  function formatarWhatsApp(valor: string) {
    return valor.replace(/\D/g, '').slice(0, 13);
  }

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true); setErro('');
    try {
      const resp = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, indicadorId: null }),
      });
      const dados = await resp.json();
      if (!resp.ok) throw new Error(dados.erro || 'Erro ao cadastrar');
      setConsultores([{ id: dados.id || Date.now().toString(), nome: form.nome, whatsapp: form.whatsapp, email: form.email, status: 'ativo', created_at: new Date().toISOString() }, ...consultores]);
      setForm({ nome: '', whatsapp: '', email: '', senha: '' });
      setMostrarForm(false);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => setMostrarForm(!mostrarForm)} className="bg-gradient"
          style={{ padding: '10px 20px', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14 }}>
          + Cadastrar Consultor
        </button>
        <button onClick={() => copiar(linkCadastro, 'cadastro')}
          style={{ padding: '10px 20px', border: '1px solid var(--avp-border)', borderRadius: 8, background: 'transparent', color: copiado === 'cadastro' ? 'var(--avp-green)' : 'var(--avp-text)', fontSize: 14, cursor: 'pointer' }}>
          {copiado === 'cadastro' ? '✓ Link copiado!' : '🔗 Copiar link de cadastro'}
        </button>
      </div>

      {mostrarForm && (
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24, marginBottom: 24, maxWidth: 480 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Novo Consultor</h3>
          <form onSubmit={handleCadastrar}>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Nome completo</label>
              <input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>WhatsApp (apenas números)</label>
              <input required placeholder="5587999999999" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: formatarWhatsApp(e.target.value) })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>E-mail</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Senha inicial</label>
              <input type="password" required minLength={6} value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} style={inputStyle} />
            </div>
            {erro && <p style={{ color: 'var(--avp-danger)', fontSize: 13, marginBottom: 12 }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={carregando} className="bg-gradient"
                style={{ padding: '10px 20px', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14, opacity: carregando ? 0.6 : 1 }}>
                {carregando ? 'Cadastrando...' : 'Cadastrar'}
              </button>
              <button type="button" onClick={() => { setMostrarForm(false); setErro(''); }}
                style={{ padding: '10px 20px', border: '1px solid var(--avp-border)', borderRadius: 8, background: 'transparent', color: 'var(--avp-text-dim)', fontSize: 14 }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {consultores.map((c) => (
          <div key={c.id} style={{
            background: 'var(--avp-card)', border: '1px solid var(--avp-border)',
            borderRadius: 10, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{c.nome}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--avp-text-dim)' }}>{c.email}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--avp-text-dim)' }}>WhatsApp: {c.whatsapp}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: c.status === 'ativo' ? 'rgba(2,161,83,0.15)' : c.status === 'concluido' ? 'rgba(51,54,135,0.2)' : 'rgba(138,143,163,0.15)',
                color: c.status === 'ativo' ? 'var(--avp-green)' : c.status === 'concluido' ? 'var(--avp-blue-bright)' : 'var(--avp-text-dim)',
              }}>
                {c.status === 'ativo' ? 'Ativo' : c.status === 'concluido' ? 'Concluído' : c.status === 'pausado' ? 'Pausado' : 'Desligado'}
              </span>
              <button onClick={() => copiar(`${appUrl}/aluno/${c.whatsapp}`, c.id)}
                style={{ padding: '6px 14px', border: '1px solid var(--avp-border)', borderRadius: 6, background: 'transparent', color: copiado === c.id ? 'var(--avp-green)' : 'var(--avp-text-dim)', fontSize: 12, cursor: 'pointer' }}>
                {copiado === c.id ? '✓ Copiado!' : '🔗 Copiar link'}
              </button>
            </div>
          </div>
        ))}
        {consultores.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--avp-text-dim)' }}>
            Nenhum consultor cadastrado ainda.
          </div>
        )}
      </div>
    </div>
  );
}

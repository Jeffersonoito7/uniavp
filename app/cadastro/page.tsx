'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: '', whatsapp: '', email: '', senha: '' });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  function formatarWhatsApp(valor: string): string {
    return valor.replace(/\D/g, '').slice(0, 13);
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true); setErro('');
    try {
      const resp = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, indicadorId: null }),
      });
      const dados = await resp.json();
      if (!resp.ok) throw new Error(dados.erro || 'Erro no cadastro');
      router.push(`/aluno/${form.whatsapp}`);
    } catch (err: any) {
      setErro(err.message); setCarregando(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--avp-border)',
    borderRadius: 10, padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14,
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5,
    color: 'var(--avp-text-dim)', marginBottom: 6, fontWeight: 600,
  };

  function Field({ label, value, onChange, type = 'text', required, placeholder }: any) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>{label}</label>
        <input type={type} required={required} value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} style={inputStyle} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      background: 'radial-gradient(ellipse at 20% 0%, rgba(51,54,135,0.35) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(2,161,83,0.25) 0%, transparent 50%), var(--avp-black)' }}>
      <div style={{ width: '100%', maxWidth: 460, background: 'rgba(24,27,36,0.7)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo.png" alt="Auto Vale Prevenções" style={{ height: 72, objectFit: 'contain', marginBottom: 16, display: 'block' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 900, letterSpacing: 3, margin: 0, textTransform: 'uppercase', color: '#fff' }}>
            UNIVERSIDADE AVP
          </h1>
          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 6, letterSpacing: 1 }}>
            Comece sua jornada como Consultor AVP
          </p>
        </div>
        <form onSubmit={handleCadastro}>
          <Field label="Nome completo" required value={form.nome} onChange={(v: string) => setForm({ ...form, nome: v })} />
          <Field label="WhatsApp (apenas números)" placeholder="5587999999999" required value={form.whatsapp}
            onChange={(v: string) => setForm({ ...form, whatsapp: formatarWhatsApp(v) })} />
          <Field label="E-mail" type="email" required value={form.email} onChange={(v: string) => setForm({ ...form, email: v })} />
          <Field label="Crie uma senha" type="password" required value={form.senha} onChange={(v: string) => setForm({ ...form, senha: v })} />
          {erro && <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid var(--avp-danger)', color: 'var(--avp-danger)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{erro}</div>}
          <button type="submit" disabled={carregando} className="bg-gradient" style={{ width: '100%', color: 'white', border: 'none', padding: 14, borderRadius: 10, fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: 2, marginTop: 8, opacity: carregando ? 0.6 : 1, boxShadow: '0 8px 24px rgba(51,54,135,0.35)' }}>
            {carregando ? 'Criando conta...' : 'Começar minha jornada'}
          </button>
        </form>
      </div>
    </div>
  );
}

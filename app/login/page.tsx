'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/aluno';
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true); setErro('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) { setErro(error.message); setCarregando(false); return; }
    router.push(redirectTo); router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--avp-border)',
    borderRadius: 10, padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14,
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5,
    color: 'var(--avp-text-dim)', marginBottom: 6, fontWeight: 600,
  };

  return (
    <form onSubmit={handleLogin}>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>E-mail</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Senha</label>
        <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} style={inputStyle} />
      </div>
      {erro && <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid var(--avp-danger)', color: 'var(--avp-danger)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{erro}</div>}
      <button type="submit" disabled={carregando} className="bg-gradient" style={{ width: '100%', color: 'white', border: 'none', padding: 14, borderRadius: 10, fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: 2, marginTop: 8, opacity: carregando ? 0.6 : 1, boxShadow: '0 8px 24px rgba(51,54,135,0.35)' }}>
        {carregando ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      background: 'radial-gradient(ellipse at 20% 0%, rgba(51,54,135,0.35) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(2,161,83,0.25) 0%, transparent 50%), var(--avp-black)' }}>
      <div style={{ width: '100%', maxWidth: 460, background: 'rgba(24,27,36,0.7)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 40, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo.png" alt="Auto Vale Prevenções" style={{ height: 72, objectFit: 'contain', marginBottom: 16, display: 'block' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 900, letterSpacing: 3, margin: 0, textTransform: 'uppercase', color: '#fff' }}>
            UNIVERSIDADE AVP
          </h1>
        </div>
        <Suspense fallback={<div style={{ color: 'var(--avp-text-dim)', textAlign: 'center' }}>Carregando...</div>}>
          <LoginForm />
        </Suspense>
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--avp-text-dim)' }}>
          Não tem cadastro? <a href="/cadastro" style={{ color: 'var(--avp-green-bright)' }}>Solicite acesso</a>
        </div>
      </div>
    </div>
  );
}

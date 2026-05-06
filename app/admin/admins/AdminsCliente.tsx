'use client';
import { useState } from 'react';

interface Admin {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  created_at: string;
}

export default function AdminsCliente({ admins: inicial, isSuperAdmin }: { admins: Admin[]; isSuperAdmin: boolean }) {
  const [admins, setAdmins] = useState<Admin[]>(inicial);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', role: 'admin' });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--avp-border)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14,
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1.5,
    color: 'var(--avp-text-dim)', marginBottom: 5, fontWeight: 600,
  };

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true); setErro('');
    try {
      const resp = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const dados = await resp.json();
      if (!resp.ok) throw new Error(dados.erro || 'Erro ao criar admin');
      setAdmins([dados.admin, ...admins]);
      setForm({ nome: '', email: '', senha: '', role: 'admin' });
      setMostrarForm(false);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleToggle(id: string, ativo: boolean) {
    await fetch('/api/admin/admins', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ativo: !ativo }),
    });
    setAdmins(admins.map(a => a.id === id ? { ...a, ativo: !ativo } : a));
  }

  return (
    <div>
      {isSuperAdmin && (
        <div style={{ marginBottom: 24 }}>
          {!mostrarForm ? (
            <button onClick={() => setMostrarForm(true)} className="bg-gradient" style={{ padding: '10px 20px', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14 }}>
              + Novo Administrador
            </button>
          ) : (
            <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24, maxWidth: 480 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Novo Administrador</h3>
              <form onSubmit={handleCriar}>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Nome</label>
                  <input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>E-mail</label>
                  <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Senha</label>
                  <input type="password" required minLength={6} value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Nível</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inputStyle}>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                {erro && <p style={{ color: 'var(--avp-danger)', fontSize: 13, marginBottom: 12 }}>{erro}</p>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={carregando} className="bg-gradient" style={{ padding: '10px 20px', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14, opacity: carregando ? 0.6 : 1 }}>
                    {carregando ? 'Criando...' : 'Criar'}
                  </button>
                  <button type="button" onClick={() => { setMostrarForm(false); setErro(''); }} style={{ padding: '10px 20px', border: '1px solid var(--avp-border)', borderRadius: 8, color: 'var(--avp-text-dim)', background: 'transparent', fontSize: 14 }}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {admins.map(admin => (
          <div key={admin.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{admin.nome}</div>
              <div style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 2 }}>{admin.email}</div>
              <div style={{ fontSize: 11, color: admin.role === 'super_admin' ? 'var(--avp-green)' : 'var(--avp-blue-bright)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: admin.ativo ? 'var(--avp-green)' : 'var(--avp-danger)' }}>
                {admin.ativo ? 'Ativo' : 'Inativo'}
              </span>
              {isSuperAdmin && (
                <button onClick={() => handleToggle(admin.id, admin.ativo)} style={{ padding: '6px 14px', border: '1px solid var(--avp-border)', borderRadius: 6, background: 'transparent', color: 'var(--avp-text-dim)', fontSize: 12, cursor: 'pointer' }}>
                  {admin.ativo ? 'Desativar' : 'Ativar'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

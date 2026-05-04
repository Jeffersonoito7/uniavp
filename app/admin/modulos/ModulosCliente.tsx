'use client';

import { useState } from 'react';

interface Modulo {
  id: string;
  ordem: number;
  titulo: string;
  publicado: boolean;
  aulas: { count: number }[];
}

export default function ModulosCliente({ modulosIniciais }: { modulosIniciais: Modulo[] }) {
  const [modulos, setModulos] = useState(modulosIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState({ titulo: '', descricao: '', ordem: '' });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function recarregar() {
    const res = await fetch('/api/admin/modulos');
    const data = await res.json();
    setModulos(data);
  }

  async function criarModulo() {
    if (!form.titulo.trim()) { setErro('Título obrigatório'); return; }
    setSalvando(true);
    setErro('');
    const res = await fetch('/api/admin/modulos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: form.titulo, descricao: form.descricao, ordem: Number(form.ordem) || 1 }),
    });
    setSalvando(false);
    if (res.ok) {
      setModalAberto(false);
      setForm({ titulo: '', descricao: '', ordem: '' });
      await recarregar();
    } else {
      const d = await res.json();
      setErro(d.error ?? 'Erro ao criar');
    }
  }

  async function togglePublicado(modulo: Modulo) {
    await fetch('/api/admin/modulos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: modulo.id, publicado: !modulo.publicado }),
    });
    await recarregar();
  }

  async function deletarModulo(id: string) {
    if (!confirm('Deletar este módulo e todas as suas aulas?')) return;
    await fetch('/api/admin/modulos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await recarregar();
  }

  return (
    <div>
      <button
        onClick={() => setModalAberto(true)}
        style={{
          padding: '10px 20px',
          background: 'var(--grad-brand)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 14,
          marginBottom: 24,
        }}
      >
        + Novo Módulo
      </button>

      {modalAberto && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: 32, width: '100%', maxWidth: 480 }}>
            <h3 style={{ fontFamily: 'Inter', fontSize: 22, letterSpacing: 2, marginBottom: 20 }}>Novo Módulo</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                placeholder="Título"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                style={inputStyle}
              />
              <input
                placeholder="Descrição (opcional)"
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                style={inputStyle}
              />
              <input
                placeholder="Ordem (ex: 1)"
                type="number"
                value={form.ordem}
                onChange={e => setForm(f => ({ ...f, ordem: e.target.value }))}
                style={inputStyle}
              />
              {erro && <p style={{ color: 'var(--avp-danger)', fontSize: 13 }}>{erro}</p>}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => { setModalAberto(false); setErro(''); }}
                style={{ padding: '10px 20px', background: 'var(--avp-border)', color: 'var(--avp-text)', border: 'none', borderRadius: 8, flex: 1 }}
              >
                Cancelar
              </button>
              <button
                onClick={criarModulo}
                disabled={salvando}
                style={{ padding: '10px 20px', background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, flex: 1, fontWeight: 600 }}
              >
                {salvando ? 'Salvando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modulos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--avp-text-dim)' }}>
          Nenhum módulo cadastrado.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {modulos.map(modulo => {
            const qtdAulas = modulo.aulas?.[0]?.count ?? 0;
            return (
              <div key={modulo.id} style={{
                background: 'var(--avp-card)',
                border: '1px solid var(--avp-border)',
                borderRadius: 10,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}>
                <span style={{ fontFamily: 'Inter', fontSize: 20, color: 'var(--avp-text-dim)', minWidth: 28 }}>
                  {modulo.ordem}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 500 }}>{modulo.titulo}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--avp-text-dim)' }}>{qtdAulas} aula{qtdAulas !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => togglePublicado(modulo)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    background: modulo.publicado ? 'rgba(2,161,83,0.2)' : 'rgba(138,143,163,0.15)',
                    color: modulo.publicado ? 'var(--avp-green)' : 'var(--avp-text-dim)',
                    cursor: 'pointer',
                  }}
                >
                  {modulo.publicado ? '● Publicado' : '○ Rascunho'}
                </button>
                <a
                  href={`/admin/modulos/${modulo.id}`}
                  style={{
                    padding: '6px 14px',
                    background: 'rgba(51,54,135,0.2)',
                    color: 'var(--avp-text)',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  Gerenciar Aulas
                </a>
                <button
                  onClick={() => deletarModulo(modulo.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--avp-danger)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'var(--avp-black)',
  border: '1px solid var(--avp-border)',
  borderRadius: 8,
  color: 'var(--avp-text)',
  fontSize: 14,
  width: '100%',
};

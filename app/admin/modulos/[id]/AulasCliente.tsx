'use client';

import { useState } from 'react';

interface Aula {
  id: string;
  ordem: number;
  titulo: string;
  descricao: string | null;
  youtube_video_id: string | null;
  duracao_minutos: number | null;
  quiz_qtd_questoes: number;
  quiz_aprovacao_minima: number;
  espera_horas: number;
  publicado: boolean;
}

const formVazio = {
  titulo: '',
  descricao: '',
  youtube_video_id: '',
  duracao_minutos: '',
  ordem: '',
  quiz_qtd_questoes: '5',
  quiz_aprovacao_minima: '70',
  espera_horas: '24',
  publicado: false,
};

export default function AulasCliente({ moduloId, aulasIniciais }: { moduloId: string; aulasIniciais: Aula[] }) {
  const [aulas, setAulas] = useState(aulasIniciais);
  const [formAberto, setFormAberto] = useState(false);
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function recarregar() {
    const res = await fetch(`/api/admin/aulas?modulo_id=${moduloId}`);
    const data = await res.json();
    setAulas(data);
  }

  async function criarAula() {
    if (!form.titulo.trim()) { setErro('Título obrigatório'); return; }
    setSalvando(true);
    setErro('');
    const res = await fetch('/api/admin/aulas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modulo_id: moduloId,
        titulo: form.titulo,
        descricao: form.descricao || null,
        youtube_video_id: form.youtube_video_id || null,
        duracao_minutos: form.duracao_minutos ? Number(form.duracao_minutos) : null,
        ordem: Number(form.ordem) || 1,
        quiz_qtd_questoes: Number(form.quiz_qtd_questoes),
        quiz_aprovacao_minima: Number(form.quiz_aprovacao_minima),
        espera_horas: Number(form.espera_horas),
        publicado: form.publicado,
      }),
    });
    setSalvando(false);
    if (res.ok) {
      setFormAberto(false);
      setForm(formVazio);
      await recarregar();
    } else {
      const d = await res.json();
      setErro(d.error ?? 'Erro ao criar');
    }
  }

  async function togglePublicado(aula: Aula) {
    await fetch('/api/admin/aulas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: aula.id, publicado: !aula.publicado }),
    });
    await recarregar();
  }

  async function deletarAula(id: string) {
    if (!confirm('Deletar esta aula?')) return;
    await fetch('/api/admin/aulas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await recarregar();
  }

  return (
    <div>
      <button
        onClick={() => setFormAberto(v => !v)}
        style={{ padding: '10px 20px', background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, marginBottom: 24 }}
      >
        {formAberto ? '− Fechar formulário' : '+ Nova Aula'}
      </button>

      {formAberto && (
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'Inter', fontSize: 18, letterSpacing: 2, marginBottom: 16 }}>Nova Aula</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <input placeholder="Título *" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <textarea placeholder="Descrição" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} />
            </div>
            <input placeholder="YouTube Video ID" value={form.youtube_video_id} onChange={e => setForm(f => ({ ...f, youtube_video_id: e.target.value }))} style={inputStyle} />
            <input placeholder="Duração (minutos)" type="number" value={form.duracao_minutos} onChange={e => setForm(f => ({ ...f, duracao_minutos: e.target.value }))} style={inputStyle} />
            <input placeholder="Ordem" type="number" value={form.ordem} onChange={e => setForm(f => ({ ...f, ordem: e.target.value }))} style={inputStyle} />
            <div />
            <input placeholder="Qtd questões quiz (1-20)" type="number" min={1} max={20} value={form.quiz_qtd_questoes} onChange={e => setForm(f => ({ ...f, quiz_qtd_questoes: e.target.value }))} style={inputStyle} />
            <input placeholder="% mínimo aprovação (50-100)" type="number" min={50} max={100} value={form.quiz_aprovacao_minima} onChange={e => setForm(f => ({ ...f, quiz_aprovacao_minima: e.target.value }))} style={inputStyle} />
            <input placeholder="Horas de espera após aprovação" type="number" min={0} value={form.espera_horas} onChange={e => setForm(f => ({ ...f, espera_horas: e.target.value }))} style={inputStyle} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.publicado} onChange={e => setForm(f => ({ ...f, publicado: e.target.checked }))} />
              Publicar imediatamente
            </label>
          </div>
          {erro && <p style={{ color: 'var(--avp-danger)', fontSize: 13, marginTop: 8 }}>{erro}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => { setFormAberto(false); setErro(''); }} style={{ padding: '10px 20px', background: 'var(--avp-border)', color: 'var(--avp-text)', border: 'none', borderRadius: 8 }}>
              Cancelar
            </button>
            <button onClick={criarAula} disabled={salvando} style={{ padding: '10px 20px', background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600 }}>
              {salvando ? 'Salvando...' : 'Criar Aula'}
            </button>
          </div>
        </div>
      )}

      {aulas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--avp-text-dim)' }}>Nenhuma aula cadastrada.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {aulas.map(aula => (
            <div key={aula.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontFamily: 'Inter', fontSize: 20, color: 'var(--avp-text-dim)', minWidth: 28 }}>{aula.ordem}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 500 }}>{aula.titulo}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--avp-text-dim)' }}>
                  Quiz: {aula.quiz_qtd_questoes} questões · {aula.quiz_aprovacao_minima}% mín · {aula.espera_horas}h espera
                </p>
              </div>
              <button
                onClick={() => togglePublicado(aula)}
                style={{ padding: '4px 12px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600, background: aula.publicado ? 'rgba(2,161,83,0.2)' : 'rgba(138,143,163,0.15)', color: aula.publicado ? 'var(--avp-green)' : 'var(--avp-text-dim)', cursor: 'pointer' }}
              >
                {aula.publicado ? '● Publicada' : '○ Rascunho'}
              </button>
              <a
                href={`/admin/aulas/${aula.id}`}
                style={{ padding: '6px 14px', background: 'rgba(51,54,135,0.2)', color: 'var(--avp-text)', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
              >
                Questões
              </a>
              <button onClick={() => deletarAula(aula.id)} style={{ background: 'none', border: 'none', color: 'var(--avp-danger)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>
                ×
              </button>
            </div>
          ))}
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

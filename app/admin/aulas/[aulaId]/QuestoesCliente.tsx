'use client';

import { useState } from 'react';

interface Alternativa {
  letra: string;
  texto: string;
  correta: boolean;
}

interface Questao {
  id: string;
  ordem: number;
  enunciado: string;
  alternativas: Alternativa[];
  explicacao: string | null;
  ativa: boolean;
}

const letras = ['A', 'B', 'C', 'D'];

const formVazio = {
  enunciado: '',
  explicacao: '',
  ordem: '',
  alternativas: { A: '', B: '', C: '', D: '' },
  correta: 'A',
};

export default function QuestoesCliente({ aulaId, questoesIniciais }: { aulaId: string; questoesIniciais: Questao[] }) {
  const [questoes, setQuestoes] = useState(questoesIniciais);
  const [formAberto, setFormAberto] = useState(false);
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function recarregar() {
    const res = await fetch(`/api/admin/questoes?aula_id=${aulaId}`);
    const data = await res.json();
    setQuestoes(data);
  }

  async function criarQuestao() {
    if (!form.enunciado.trim()) { setErro('Enunciado obrigatório'); return; }
    for (const l of letras) {
      if (!form.alternativas[l as keyof typeof form.alternativas].trim()) {
        setErro(`Alternativa ${l} obrigatória`); return;
      }
    }
    setSalvando(true);
    setErro('');

    const alternativas: Alternativa[] = letras.map(l => ({
      letra: l,
      texto: form.alternativas[l as keyof typeof form.alternativas],
      correta: l === form.correta,
    }));

    const res = await fetch('/api/admin/questoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aula_id: aulaId,
        enunciado: form.enunciado,
        alternativas,
        explicacao: form.explicacao || null,
        ordem: Number(form.ordem) || (questoes.length + 1),
        ativa: true,
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

  async function toggleAtiva(questao: Questao) {
    await fetch('/api/admin/questoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: questao.id, ativa: !questao.ativa }),
    });
    await recarregar();
  }

  async function deletarQuestao(id: string) {
    if (!confirm('Deletar esta questão?')) return;
    await fetch('/api/admin/questoes', {
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
        {formAberto ? '− Fechar formulário' : '+ Nova Questão'}
      </button>

      {formAberto && (
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'Inter', fontSize: 18, letterSpacing: 2, marginBottom: 16 }}>Nova Questão</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <textarea
              placeholder="Enunciado da questão *"
              value={form.enunciado}
              onChange={e => setForm(f => ({ ...f, enunciado: e.target.value }))}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            />
            <input
              placeholder="Ordem (ex: 1)"
              type="number"
              value={form.ordem}
              onChange={e => setForm(f => ({ ...f, ordem: e.target.value }))}
              style={{ ...inputStyle, maxWidth: 180 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {letras.map(l => (
                <div key={l} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 60, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="correta"
                      value={l}
                      checked={form.correta === l}
                      onChange={() => setForm(f => ({ ...f, correta: l }))}
                    />
                    <span style={{ fontWeight: 700, color: form.correta === l ? 'var(--avp-green)' : 'var(--avp-text-dim)' }}>{l}</span>
                  </label>
                  <input
                    placeholder={`Alternativa ${l}`}
                    value={form.alternativas[l as keyof typeof form.alternativas]}
                    onChange={e => setForm(f => ({ ...f, alternativas: { ...f.alternativas, [l]: e.target.value } }))}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
            <textarea
              placeholder="Explicação (opcional) — mostrada quando errar"
              value={form.explicacao}
              onChange={e => setForm(f => ({ ...f, explicacao: e.target.value }))}
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
            />
            {erro && <p style={{ color: 'var(--avp-danger)', fontSize: 13 }}>{erro}</p>}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => { setFormAberto(false); setErro(''); }} style={{ padding: '10px 20px', background: 'var(--avp-border)', color: 'var(--avp-text)', border: 'none', borderRadius: 8 }}>
              Cancelar
            </button>
            <button onClick={criarQuestao} disabled={salvando} style={{ padding: '10px 20px', background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600 }}>
              {salvando ? 'Salvando...' : 'Criar Questão'}
            </button>
          </div>
        </div>
      )}

      {questoes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--avp-text-dim)' }}>Nenhuma questão cadastrada.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {questoes.map((q, i) => (
            <div key={q.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: 20, opacity: q.ativa ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 10px', fontWeight: 500, lineHeight: 1.5 }}>
                    <span style={{ fontFamily: 'Inter', fontSize: 16, color: 'var(--avp-text-dim)', marginRight: 8 }}>{i + 1}.</span>
                    {q.enunciado}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {q.alternativas.map(alt => (
                      <div key={alt.letra} style={{
                        fontSize: 13,
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: alt.correta ? 'rgba(2,161,83,0.12)' : 'transparent',
                        color: alt.correta ? 'var(--avp-green)' : 'var(--avp-text-dim)',
                        border: alt.correta ? '1px solid rgba(2,161,83,0.3)' : '1px solid transparent',
                      }}>
                        <strong>{alt.letra}.</strong> {alt.texto}
                      </div>
                    ))}
                  </div>
                  {q.explicacao && (
                    <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 8, fontStyle: 'italic' }}>{q.explicacao}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => toggleAtiva(q)}
                    style={{ padding: '4px 12px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600, background: q.ativa ? 'rgba(2,161,83,0.2)' : 'rgba(138,143,163,0.15)', color: q.ativa ? 'var(--avp-green)' : 'var(--avp-text-dim)', cursor: 'pointer' }}
                  >
                    {q.ativa ? 'Ativa' : 'Inativa'}
                  </button>
                  <button onClick={() => deletarQuestao(q.id)} style={{ background: 'none', border: 'none', color: 'var(--avp-danger)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>
                    ×
                  </button>
                </div>
              </div>
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

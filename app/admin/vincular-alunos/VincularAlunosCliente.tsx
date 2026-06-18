'use client'
import { useState } from 'react'

type Aluno = { id: string; nome: string; whatsapp: string; email: string; gestor_whatsapp: string | null; gestor_nome: string | null; created_at: string | null }
type Gestor = { id: string; nome: string; whatsapp: string; ativo: boolean | null; status_assinatura: string | null }

export default function VincularAlunosCliente({
  semGestor,
  gestores,
}: {
  semGestor: Aluno[]
  gestores: Gestor[]
}) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [gestorId, setGestorId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [resultado, setResultado] = useState('')
  const [erro, setErro] = useState('')
  const [lista, setLista] = useState(semGestor)
  const [normalizando, setNormalizando] = useState(false)
  const [resultNorm, setResultNorm] = useState<{ corrigidos: number; detalhes: string[] } | null>(null)

  async function normalizar() {
    setNormalizando(true)
    setResultNorm(null)
    try {
      const res = await fetch('/api/admin/vincular-alunos', { method: 'PATCH' })
      const data = await res.json()
      setResultNorm(data)
    } catch {
      setResultNorm({ corrigidos: 0, detalhes: ['Falha na requisição.'] })
    } finally {
      setNormalizando(false)
    }
  }

  function toggleAluno(id: string) {
    setSelecionados(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function toggleTodos() {
    if (selecionados.size === lista.length) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(lista.map(a => a.id)))
    }
  }

  async function vincular() {
    if (!gestorId) { setErro('Selecione um PRO para vincular.'); return }
    if (selecionados.size === 0) { setErro('Selecione pelo menos um aluno.'); return }
    setSalvando(true)
    setErro('')
    setResultado('')
    try {
      const res = await fetch('/api/admin/vincular-alunos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gestor_id: gestorId, aluno_ids: Array.from(selecionados) }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? 'Erro ao vincular.'); return }
      setResultado(`${data.vinculados} aluno(s) vinculados a ${data.gestorNome} com sucesso.`)
      setLista(prev => prev.filter(a => !selecionados.has(a.id)))
      setSelecionados(new Set())
    } catch {
      setErro('Falha na requisição.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      {/* Normalizacao automatica: corrige formato de whatsapp diferente */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '20px 24px', marginBottom: 28 }}>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Corrigir formatos de whatsapp (caso Pablo Alves)</p>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 14 }}>
          Alunos que eram ligados a um consultor FREE podem ter o whatsapp do PRO em formato diferente
          (ex: com ou sem DDI 55). Isso faz com que nao aparecam no painel PRO. Clique abaixo para corrigir automaticamente.
        </p>

        {resultNorm && (
          <div style={{ marginBottom: 14 }}>
            {resultNorm.corrigidos > 0 ? (
              <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                {resultNorm.corrigidos} aluno(s) normalizados com sucesso.
              </p>
            ) : (
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 8 }}>
                Nenhum aluno com formato incorreto encontrado.
              </p>
            )}
            {resultNorm.detalhes.filter(d => d.startsWith('OK')).map((d, i) => (
              <p key={i} style={{ fontSize: 12, color: '#4ade80', margin: '2px 0' }}>{d}</p>
            ))}
            {resultNorm.detalhes.filter(d => d.startsWith('ERRO')).map((d, i) => (
              <p key={i} style={{ fontSize: 12, color: '#f87171', margin: '2px 0' }}>{d}</p>
            ))}
          </div>
        )}

        <button
          onClick={normalizar}
          disabled={normalizando}
          style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 800, fontSize: 13, cursor: normalizando ? 'not-allowed' : 'pointer', opacity: normalizando ? 0.7 : 1 }}
        >
          {normalizando ? 'Verificando...' : 'Normalizar formatos de whatsapp'}
        </button>
      </div>

      {/* Vincular alunos sem gestor */}
      {lista.length === 0 && !resultado ? (
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '24px', textAlign: 'center' }}>
          <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 16 }}>Todos os alunos ja estao vinculados a um PRO.</p>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 8 }}>Nenhum aluno sem gestor encontrado.</p>
        </div>
      ) : (
    <div>
      {resultado && (
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 15 }}>{resultado}</p>
        </div>
      )}

      {lista.length > 0 && (
        <>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--avp-text)' }}>
              1. Escolha o PRO que vai receber os alunos:
            </p>
            <select
              value={gestorId}
              onChange={e => setGestorId(e.target.value)}
              style={{ width: '100%', background: 'var(--avp-bg)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14 }}
            >
              <option value=''>-- Selecione o PRO --</option>
              {gestores.map(g => (
                <option key={g.id} value={g.id}>
                  {g.nome} ({g.whatsapp}) {g.ativo ? '' : '— INATIVO'}
                </option>
              ))}
            </select>
          </div>

          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--avp-text)', margin: 0 }}>
                2. Selecione os alunos ({lista.length} sem gestor):
              </p>
              <button onClick={toggleTodos} style={{ background: 'none', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '4px 12px', color: 'var(--avp-text-dim)', fontSize: 12, cursor: 'pointer' }}>
                {selecionados.size === lista.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>

            <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {lista.map(a => (
                <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: selecionados.has(a.id) ? 'rgba(99,102,241,0.08)' : 'var(--avp-bg)', border: `1px solid ${selecionados.has(a.id) ? '#6366f1' : 'var(--avp-border)'}`, borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}>
                  <input
                    type='checkbox'
                    checked={selecionados.has(a.id)}
                    onChange={() => toggleAluno(a.id)}
                    style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{a.nome}</p>
                    <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>{a.whatsapp} · {a.email}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {erro && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{erro}</p>}

          <button
            onClick={vincular}
            disabled={salvando || selecionados.size === 0 || !gestorId}
            style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 800, fontSize: 14, cursor: salvando || selecionados.size === 0 || !gestorId ? 'not-allowed' : 'pointer', opacity: salvando || selecionados.size === 0 || !gestorId ? 0.6 : 1 }}
          >
            {salvando ? 'Vinculando...' : `Vincular ${selecionados.size > 0 ? selecionados.size : ''} aluno(s) ao PRO selecionado`}
          </button>
        </>
      )}

      {lista.length === 0 && resultado && (
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Nenhum aluno sem gestor restante.</p>
        </div>
      )}
    </div>
      )}
    </div>
  )
}

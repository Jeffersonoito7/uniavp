'use client'
import { useState } from 'react'

type Aula = {
  id: string
  titulo: string
  ordem: number
  youtube_video_id: string
  duracao_minutos: number | null
  quiz_qtd_questoes: number
  quiz_aprovacao_minima: number
  espera_horas: number
  publicado: boolean
  ao_vivo_link: string | null
  ao_vivo_data: string | null
  ao_vivo_plataforma: string | null
  validade_meses: number | null
}

export default function AulasCliente({ moduloId, aulasIniciais }: { moduloId: string; aulasIniciais: Aula[] }) {
  const [aulas, setAulas] = useState<Aula[]>(aulasIniciais)
  const [criando, setCriando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [aoVivo, setAoVivo] = useState(false)
  const [form, setForm] = useState({
    titulo: '', youtube_video_id: '', duracao_minutos: '',
    quiz_qtd_questoes: 5, quiz_aprovacao_minima: 80, espera_horas: 24,
    ao_vivo_link: '', ao_vivo_data: '', ao_vivo_plataforma: 'zoom',
    validade_meses: '',
  })
  const [msg, setMsg] = useState('')

  async function salvarAula(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const body: Record<string, unknown> = {
      modulo_id: moduloId,
      titulo: form.titulo,
      youtube_video_id: form.youtube_video_id,
      duracao_minutos: form.duracao_minutos ? parseInt(form.duracao_minutos) : null,
      quiz_qtd_questoes: form.quiz_qtd_questoes,
      quiz_aprovacao_minima: form.quiz_aprovacao_minima,
      espera_horas: form.espera_horas,
      validade_meses: form.validade_meses ? parseInt(form.validade_meses) : null,
    }
    if (aoVivo && form.ao_vivo_link) {
      body.ao_vivo_link = form.ao_vivo_link
      body.ao_vivo_data = form.ao_vivo_data || null
      body.ao_vivo_plataforma = form.ao_vivo_plataforma
    }
    const res = await fetch(`/api/admin/modulos/${moduloId}/aulas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.aula) {
      setAulas(a => [...a, data.aula])
      setCriando(false)
      setAoVivo(false)
      setForm({ titulo: '', youtube_video_id: '', duracao_minutos: '', quiz_qtd_questoes: 5, quiz_aprovacao_minima: 80, espera_horas: 24, ao_vivo_link: '', ao_vivo_data: '', ao_vivo_plataforma: 'zoom', validade_meses: '' })
      setMsg('Aula criada com sucesso!')
    }
    setSalvando(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const cardStyle = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }
  const inputStyle = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none' }
  const labelStyle = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {msg && <div style={{ padding: '12px 16px', background: '#02A15320', border: '1px solid var(--avp-green)', borderRadius: 8, color: 'var(--avp-green)', fontSize: 14 }}>{msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Aulas ({aulas.length})</h2>
        <button onClick={() => setCriando(c => !c)} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          {criando ? 'Cancelar' : '+ Nova Aula'}
        </button>
      </div>

      {criando && (
        <form onSubmit={salvarAula} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontWeight: 700 }}>Nova Aula</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Título *</label>
              <input style={inputStyle} value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} required />
            </div>
            <div>
              <label style={labelStyle}>YouTube Video ID *</label>
              <input style={inputStyle} value={form.youtube_video_id} onChange={e => setForm(p => ({ ...p, youtube_video_id: e.target.value }))} required />
            </div>
            <div>
              <label style={labelStyle}>Duração (min)</label>
              <input type="number" style={inputStyle} value={form.duracao_minutos} onChange={e => setForm(p => ({ ...p, duracao_minutos: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Espera após aprovação (horas)</label>
              <input type="number" style={inputStyle} value={form.espera_horas} onChange={e => setForm(p => ({ ...p, espera_horas: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label style={labelStyle}>Questões no quiz</label>
              <input type="number" style={inputStyle} value={form.quiz_qtd_questoes} onChange={e => setForm(p => ({ ...p, quiz_qtd_questoes: parseInt(e.target.value) }))} min={1} max={20} />
            </div>
            <div>
              <label style={labelStyle}>Aprovação mínima (%)</label>
              <input type="number" style={inputStyle} value={form.quiz_aprovacao_minima} onChange={e => setForm(p => ({ ...p, quiz_aprovacao_minima: parseInt(e.target.value) }))} min={50} max={100} />
            </div>
            <div>
              <label style={labelStyle}>Validade (meses, 0 = sem validade)</label>
              <input type="number" style={inputStyle} value={form.validade_meses} onChange={e => setForm(p => ({ ...p, validade_meses: e.target.value }))} min={0} placeholder="Opcional" />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: aoVivo ? 16 : 0 }}>
              <input type="checkbox" checked={aoVivo} onChange={e => setAoVivo(e.target.checked)} style={{ width: 16, height: 16 }} />
              <span style={{ color: 'var(--avp-text)', fontWeight: 600 }}>Aula ao vivo</span>
            </label>
            {aoVivo && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Link da reunião</label>
                  <input style={inputStyle} value={form.ao_vivo_link} onChange={e => setForm(p => ({ ...p, ao_vivo_link: e.target.value }))} placeholder="https://zoom.us/..." />
                </div>
                <div>
                  <label style={labelStyle}>Data e hora</label>
                  <input type="datetime-local" style={inputStyle} value={form.ao_vivo_data} onChange={e => setForm(p => ({ ...p, ao_vivo_data: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Plataforma</label>
                  <select style={inputStyle} value={form.ao_vivo_plataforma} onChange={e => setForm(p => ({ ...p, ao_vivo_plataforma: e.target.value }))}>
                    <option value="zoom">Zoom</option>
                    <option value="meet">Google Meet</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={salvando} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, alignSelf: 'flex-start' }}>
            {salvando ? 'Salvando...' : 'Criar Aula'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {aulas.sort((a, b) => a.ordem - b.ordem).map(aula => (
          <div key={aula.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ background: 'var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>#{aula.ordem}</span>
                <h3 style={{ fontWeight: 700, fontSize: 15 }}>{aula.titulo}</h3>
                {aula.ao_vivo_link && <span style={{ background: '#33368720', color: '#6366f1', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>AO VIVO</span>}
                {aula.validade_meses && <span style={{ background: '#f59e0b20', color: '#f59e0b', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>Validade: {aula.validade_meses}m</span>}
              </div>
              <div style={{ display: 'flex', gap: 16, color: 'var(--avp-text-dim)', fontSize: 13 }}>
                <span>{aula.youtube_video_id}</span>
                {aula.duracao_minutos && <span>{aula.duracao_minutos} min</span>}
                <span>Quiz: {aula.quiz_qtd_questoes}q / {aula.quiz_aprovacao_minima}%</span>
                <span>Espera: {aula.espera_horas}h</span>
              </div>
            </div>
            <span style={{ color: aula.publicado ? 'var(--avp-green)' : 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600 }}>
              {aula.publicado ? 'Publicada' : 'Rascunho'}
            </span>
          </div>
        ))}
        {aulas.length === 0 && !criando && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--avp-text-dim)' }}>Nenhuma aula cadastrada ainda.</div>
        )}
      </div>
    </div>
  )
}

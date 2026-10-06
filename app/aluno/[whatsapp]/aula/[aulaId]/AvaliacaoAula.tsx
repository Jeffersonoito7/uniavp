'use client'
import { useState } from 'react'
import { Star } from 'lucide-react'

export default function AvaliacaoAula({ aulaId, estrelasIniciais, sugestaoInicial }: {
 aulaId: string
 estrelasIniciais: number | null
 sugestaoInicial: string | null
}) {
 const [estrelas, setEstrelas] = useState<number>(estrelasIniciais ?? 0)
 const [hover, setHover] = useState(0)
 const [sugestao, setSugestao] = useState(sugestaoInicial ?? '')
 const [salvando, setSalvando] = useState(false)
 const [msg, setMsg] = useState('')
 const [expandido, setExpandido] = useState(false)

 async function salvar(e: number) {
 setEstrelas(e)
 setSalvando(true)
 setMsg('')
 await fetch('/api/aluno/avaliacao', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ aula_id: aulaId, estrelas: e, sugestao }),
 })
 setSalvando(false)
 setMsg(' Avaliação salva!')
 setExpandido(true)
 setTimeout(() => setMsg(''), 3000)
 }

 async function salvarSugestao() {
 if (!estrelas) return
 setSalvando(true)
 await fetch('/api/aluno/avaliacao', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ aula_id: aulaId, estrelas, sugestao }),
 })
 setSalvando(false)
 setMsg(' Sugestão enviada, obrigado!')
 setTimeout(() => setMsg(''), 3000)
 }

 return (
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '20px 24px' }}>
 <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Como você avalia esta aula?</p>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 16 }}>Sua avaliação nos ajuda a melhorar o conteúdo.</p>

 {/* Estrelas */}
 <div style={{ display: 'flex', gap: 6, marginBottom: expandido ? 16 : 0 }}>
 {[1, 2, 3, 4, 5].map(n => {
 const ativa = (hover || estrelas) >= n
 return (
 <button
 key={n}
 onClick={() => salvar(n)}
 onMouseEnter={() => setHover(n)}
 onMouseLeave={() => setHover(0)}
 aria-label={`Avaliar com ${n} estrela${n > 1 ? 's' : ''}`}
 aria-pressed={estrelas === n}
 style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', lineHeight: 0, transition: 'transform 0.1s', transform: hover >= n || estrelas >= n ? 'scale(1.15)' : 'scale(1)' }}
 >
 <Star
 size={32}
 style={{ transition: 'color 0.15s, fill 0.15s' }}
 color={ativa ? '#f59e0b' : 'var(--avp-border)'}
 fill={ativa ? '#f59e0b' : 'none'}
 />
 </button>
 )
 })}
 {estrelas> 0 && (
 <span style={{ alignSelf: 'center', marginLeft: 8, fontSize: 13, color: 'var(--avp-text-dim)' }}>
 {['', 'Ruim', 'Regular', 'Bom', 'Ótimo', 'Excelente!'][estrelas]}
 </span>
 )}
 </div>

 {/* Sugestão — aparece após dar estrelas */}
 {expandido && (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 <div>
 <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--avp-text-dim)', marginBottom: 6 }}>
 Tem alguma sugestão para melhorar? <span style={{ fontWeight: 400 }}>(opcional)</span>
 </label>
 <textarea
 value={sugestao}
 onChange={e => setSugestao(e.target.value)}
 placeholder="Ex: Poderia ter mais exemplos práticos, o áudio ficou baixo..."
 rows={3}
 style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
 />
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <button onClick={salvarSugestao} disabled={salvando}
 style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}>
 {salvando ? 'Enviando...' : 'Enviar feedback'}
 </button>
 {msg && <span style={{ fontSize: 13, color: 'var(--avp-green)' }}>{msg}</span>}
 </div>
 </div>
 )}

 {msg && !expandido && <p style={{ marginTop: 8, fontSize: 13, color: 'var(--avp-green)' }}>{msg}</p>}
 </div>
 )
}

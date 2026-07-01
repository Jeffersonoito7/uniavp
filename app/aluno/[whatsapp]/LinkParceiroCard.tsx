'use client'
import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

type Props = {
  alunoId: string
  linkAtual: string | null
  whatsapp: string
  baseUrl: string
}

export default function LinkParceiroCard({ alunoId, linkAtual, whatsapp, baseUrl }: Props) {
  const [link, setLink] = useState(linkAtual ?? '')
  const [linkSalvo, setLinkSalvo] = useState(linkAtual ?? '')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<'ok' | 'err' | null>(null)
  const [copiado, setCopiado] = useState(false)

  const linkCaptacao = `${baseUrl}/c/${whatsapp}`

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setMsg(null)
    const res = await fetch('/api/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aluno_id: alunoId, link_externo: link.trim() || null }),
    })
    if (res.ok) {
      setLinkSalvo(link.trim())
      setMsg('ok')
    } else {
      setMsg('err')
    }
    setSalvando(false)
    setTimeout(() => setMsg(null), 3000)
  }

  function copiarLinkCaptacao() {
    navigator.clipboard.writeText(linkCaptacao)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: '18px 20px', marginBottom: 28 }}>
      <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 7 }}>
        <Link2 size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
        Meu link da plataforma parceira
      </p>
      <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '0 0 12px' }}>
        Cole aqui o seu link de indicacao. Aparece para quem voce recrutar ao completar certas aulas.
      </p>
      <form onSubmit={salvar} style={{ display: 'flex', gap: 8 }}>
        <input
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="https://..."
          style={{ flex: 1, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '9px 13px', color: 'var(--avp-text)', fontSize: 13, outline: 'none' }}
        />
        <button
          type="submit"
          disabled={salvando}
          style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0, opacity: salvando ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {msg === 'ok' ? <><Check size={13} /> Salvo</> : salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
      {msg === 'err' && <p style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>Erro ao salvar. Tente novamente.</p>}

      <div style={{ marginTop: 16, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '12px 14px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase' as const, letterSpacing: 1, margin: '0 0 6px' }}>
          Seu link de captacao
        </p>
        <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '0 0 10px', lineHeight: 1.5 }}>
          {linkSalvo
            ? 'Quem se cadastrar por este link vera seu link da plataforma parceira automaticamente.'
            : 'Compartilhe este link para trazer novos membros. Configure o link parceiro acima para aparecer no cadastro deles.'}
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#22c55e', flex: 1, wordBreak: 'break-all' as const, minWidth: 0 }}>{linkCaptacao}</span>
          <button
            onClick={copiarLinkCaptacao}
            style={{ background: copiado ? 'rgba(34,197,94,0.15)' : 'var(--avp-black)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 7, padding: '6px 12px', color: '#22c55e', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' as const }}>
            {copiado ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>
    </div>
  )
}

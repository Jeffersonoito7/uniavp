'use client'
import { useState } from 'react'

function BotaoCopiar({ url, label, desc, icon }: { url: string; label: string; desc: string; icon: string }) {
  const [copiado, setCopiado] = useState(false)
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url

  function copiar() {
    navigator.clipboard.writeText(fullUrl)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div style={{ background: 'var(--avp-black)', borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ fontSize: 28, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginBottom: 6 }}>{desc}</p>
        <p style={{ fontSize: 12, color: 'var(--avp-blue)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullUrl}</p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          Ver
        </a>
        <button onClick={copiar}
          style={{ background: copiado ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, minWidth: 90 }}>
          {copiado ? '✓ Copiado!' : 'Copiar link'}
        </button>
      </div>
    </div>
  )
}

export default function LinksCaptacao() {
  return (
    <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24, marginTop: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>🔗 Links de Cadastro</p>
        <p style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>Copie e envie para gestores ou consultores se cadastrarem na plataforma.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BotaoCopiar
          icon="👔"
          label="Cadastro de Gestor"
          desc="Envie para quem vai ser gestor. O cadastro fica pendente até você ativar no painel de Gestores."
          url="/convite/gestor"
        />
        <BotaoCopiar
          icon="👤"
          label="Cadastro de Consultor (sem gestor)"
          desc="Use quando o consultor não tem gestor específico. O admin acompanha pelo CRM."
          url="/captacao"
        />
      </div>
    </div>
  )
}

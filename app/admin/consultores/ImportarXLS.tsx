'use client'
import { useState } from 'react'

export default function ImportarXLS({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<{ importados: number; erros: { linha: number; motivo: string }[] } | null>(null)

  async function handleImportar() {
    if (!file) return
    setLoading(true)
    const formData = new FormData()
    formData.append('arquivo', file)
    const res = await fetch('/api/admin/importar-consultores', { method: 'POST', body: formData })
    const data = await res.json()
    setResultado(data)
    setLoading(false)
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  }
  const modalStyle: React.CSSProperties = {
    background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16,
    padding: 32, width: 480, maxWidth: '95vw',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)',
    borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none',
  }

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--avp-text)' }}>Importar Consultores via XLS</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        {!resultado ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--avp-black)', borderRadius: 8, padding: 16, border: '1px solid var(--avp-border)' }}>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 12 }}>
                Baixe o modelo, preencha com os dados dos consultores e importe o arquivo.
              </p>
              <a
                href="/api/admin/modelo-importacao"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--avp-green)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
              >
                ⬇ Baixar modelo .xlsx
              </a>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginTop: 8 }}>
                Colunas: nome | whatsapp | email | senha
              </p>
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }}>
                Selecionar arquivo .xlsx
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                style={inputStyle}
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
              <button
                onClick={handleImportar}
                disabled={!file || loading}
                style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: (!file || loading) ? 0.5 : 1 }}
              >
                {loading ? 'Importando...' : 'Importar'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#02A15320', border: '1px solid var(--avp-green)', borderRadius: 8, padding: 16 }}>
              <p style={{ color: 'var(--avp-green)', fontWeight: 700, fontSize: 16 }}>
                {resultado.importados} importado{resultado.importados !== 1 ? 's' : ''} com sucesso
              </p>
            </div>
            {resultado.erros.length > 0 && (
              <div style={{ background: '#e6394620', border: '1px solid var(--avp-danger)', borderRadius: 8, padding: 16 }}>
                <p style={{ color: 'var(--avp-danger)', fontWeight: 700, marginBottom: 8 }}>{resultado.erros.length} erro{resultado.erros.length !== 1 ? 's' : ''}:</p>
                {resultado.erros.map((e, i) => (
                  <p key={i} style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>Linha {e.linha}: {e.motivo}</p>
                ))}
              </div>
            )}
            <button onClick={onClose} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

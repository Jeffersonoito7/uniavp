export default function AdminLoading() {
  return (
    <div style={{ animation: 'pulse 1.4s ease-in-out infinite' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .sk { background:var(--avp-border); border-radius:8px; }
      `}</style>

      {/* Título */}
      <div className="sk" style={{ height: 28, width: 220, marginBottom: 8 }} />
      <div className="sk" style={{ height: 16, width: 160, marginBottom: 32 }} />

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '16px 18px' }}>
            <div className="sk" style={{ height: 11, width: 90, marginBottom: 12 }} />
            <div className="sk" style={{ height: 32, width: 70, marginBottom: 6 }} />
            <div className="sk" style={{ height: 12, width: 110 }} />
          </div>
        ))}
      </div>

      {/* Bloco de conteúdo */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--avp-border)', alignItems: 'center' }}>
            <div className="sk" style={{ height: 14, width: 80, flexShrink: 0 }} />
            <div className="sk" style={{ height: 14, flex: 1, maxWidth: 240 }} />
            <div className="sk" style={{ height: 14, width: 60 }} />
            <div className="sk" style={{ height: 24, width: 50, borderRadius: 20 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

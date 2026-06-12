'use client'

type Props = {
  checked: boolean
}

// Componente visual puro — sem onClick proprio.
// Envolva em <label onClick={...}> para interatividade.
export function TogglePill({ checked }: Props) {
  return (
    <div
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? '#22c55e' : '#ef4444',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
        }}
      />
    </div>
  )
}

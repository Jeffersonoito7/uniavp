'use client'
import React from 'react'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  style?: React.CSSProperties
  disabled?: boolean
}

export default function PhoneInput({ value, onChange, placeholder = '87 9 9999-9999', required, style, disabled }: PhoneInputProps) {
  // Exibe sem o "55" para o usuário digitar só DDD+número
  const displayValue = value.startsWith('55') ? value.slice(2) : value

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    // Sempre armazena com "55" na frente
    onChange(digits ? '55' + digits : '')
  }

  const baseStyle: React.CSSProperties = {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--avp-text)', fontSize: 14, padding: '0 14px 0 8px',
    fontFamily: 'inherit', minWidth: 0,
    ...style,
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    background: style?.background ?? 'rgba(8,9,13,0.8)',
    border: '1px solid var(--avp-border)',
    borderRadius: style?.borderRadius ?? 8,
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <div style={containerStyle}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '0 10px 0 12px', borderRight: '1px solid var(--avp-border)',
        height: 44, flexShrink: 0, background: 'rgba(255,255,255,0.03)',
      }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>🇧🇷</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--avp-text-dim)', letterSpacing: 0.5 }}>+55</span>
      </div>
      <input
        type="tel"
        inputMode="numeric"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        style={{ ...baseStyle, padding: '12px 14px 12px 10px' }}
      />
    </div>
  )
}

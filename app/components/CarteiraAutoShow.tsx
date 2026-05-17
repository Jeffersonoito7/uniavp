'use client'
import { useState, useEffect } from 'react'
import CarteiraPopup from './CarteiraPopup'

export default function CarteiraAutoShow({ nomeAluno, numRegistro, whatsapp }: {
  nomeAluno: string
  numRegistro: string
  whatsapp: string
}) {
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(`carteira_vista_${whatsapp}`)) setMostrar(true)
    } catch { /* */ }
  }, [whatsapp])

  if (!mostrar) return null

  return (
    <CarteiraPopup
      nomeAluno={nomeAluno}
      numRegistro={numRegistro}
      whatsapp={whatsapp}
      onClose={() => {
        try { localStorage.setItem(`carteira_vista_${whatsapp}`, '1') } catch { /* */ }
        setMostrar(false)
      }}
    />
  )
}

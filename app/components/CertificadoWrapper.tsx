'use client'
import { useState } from 'react'
import CertificadoPopup from './CertificadoPopup'

type Props = {
  nomeAluno: string
  templateUrl: string
}

export default function CertificadoWrapper({ nomeAluno, templateUrl }: Props) {
  const [aberto, setAberto] = useState(true)
  if (!aberto) return null
  return <CertificadoPopup nomeAluno={nomeAluno} templateUrl={templateUrl} onClose={() => setAberto(false)} />
}

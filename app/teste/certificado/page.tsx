import CertificadoWrapper from '@/app/components/CertificadoWrapper'

export default function TesteCertificado() {
  return (
    <div style={{ minHeight: '100vh', background: '#08090d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CertificadoWrapper
        nomeAluno="Jefferson Soares"
        templateUrl=""
      />
    </div>
  )
}

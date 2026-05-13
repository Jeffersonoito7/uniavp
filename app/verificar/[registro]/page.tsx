import { createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'

export default async function VerificarPage({ params }: { params: { registro: string } }) {
  const adminClient = createServiceRoleClient()
  const config = await getSiteConfig()

  const numBusca = parseInt(params.registro.replace(/^0+/, '') || '0')

  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('nome, status, numero_registro, data_formacao')
    .eq('numero_registro', numBusca)
    .maybeSingle()

  const valido = aluno?.status === 'concluido' && aluno?.data_formacao
  const dataFormacao = aluno?.data_formacao ? new Date(aluno.data_formacao + 'T12:00:00') : null
  const dataValidade = dataFormacao ? new Date(dataFormacao) : null
  if (dataValidade) dataValidade.setFullYear(dataValidade.getFullYear() + 2)
  const hoje = new Date()
  const dentro_validade = dataValidade ? hoje <= dataValidade : false
  const status = !aluno ? 'nao_encontrado' : !valido ? 'invalido' : !dentro_validade ? 'expirado' : 'valido'

  const cores = {
    valido:        { bg: '#02A15315', border: '#02A153', text: '#02A153', icone: '✅' },
    expirado:      { bg: '#f59e0b15', border: '#f59e0b', text: '#f59e0b', icone: '⚠️' },
    invalido:      { bg: '#e6394615', border: '#e63946', text: '#e63946', icone: '❌' },
    nao_encontrado:{ bg: '#e6394615', border: '#e63946', text: '#e63946', icone: '❌' },
  }
  const c = cores[status]

  const msgs = {
    valido:        'Documento VÁLIDO — Consultor Certificado',
    expirado:      'Certificação EXPIRADA — Prazo de 2 anos vencido',
    invalido:      'Documento INVÁLIDO — Curso não concluído',
    nao_encontrado:'Registro NÃO ENCONTRADO',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#08090d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {config.logoUrl
            ? <img src={config.logoUrl} alt={config.nome} style={{ height: 56, objectFit: 'contain', marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            : <p style={{ fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 12 }}>{config.nome}</p>
          }
          <p style={{ color: '#666', fontSize: 14 }}>Sistema de Verificação de Autenticidade</p>
        </div>

        {/* Card resultado */}
        <div style={{ background: '#181b24', border: `2px solid ${c.border}`, borderRadius: 16, overflow: 'hidden' }}>

          {/* Status banner */}
          <div style={{ background: c.bg, borderBottom: `1px solid ${c.border}`, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 40 }}>{c.icone}</span>
            <div>
              <p style={{ fontWeight: 800, fontSize: 16, color: c.text, margin: 0 }}>{msgs[status]}</p>
              <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Nº de Registro: <strong style={{ color: '#fff' }}>{params.registro}</strong></p>
            </div>
          </div>

          {/* Dados */}
          {aluno && (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Row label="Nome" value={aluno.nome} />
              <Row label="Nº de Registro" value={String(aluno.numero_registro).padStart(6, '0')} />
              <Row label="Curso" value={`Formação de Consultor — ${config.nome}`} />
              {dataFormacao && <Row label="Data de Formação" value={dataFormacao.toLocaleDateString('pt-BR')} />}
              {dataValidade && (
                <Row
                  label="Validade"
                  value={dataValidade.toLocaleDateString('pt-BR')}
                  destaque={dentro_validade ? 'verde' : 'vermelho'}
                />
              )}
              <Row label="Status" value={aluno.status === 'concluido' ? 'Curso Concluído' : 'Curso em Andamento'} />
            </div>
          )}

          {!aluno && (
            <div style={{ padding: 32, textAlign: 'center', color: '#555' }}>
              <p style={{ fontSize: 15 }}>Nenhum registro encontrado com este número.</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>Verifique se o número foi digitado corretamente.</p>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <p style={{ color: '#444', fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
          Este sistema garante a autenticidade dos documentos emitidos por {config.nome}.<br />
          Em caso de dúvidas, entre em contato conosco.
        </p>
      </div>
    </div>
  )
}

function Row({ label, value, destaque }: { label: string; value: string; destaque?: 'verde' | 'vermelho' }) {
  const cor = destaque === 'verde' ? '#02A153' : destaque === 'vermelho' ? '#e63946' : '#fff'
  return (
    <div style={{ borderBottom: '1px solid #252836', paddingBottom: 14 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 600, color: cor, margin: 0 }}>{value}</p>
    </div>
  )
}

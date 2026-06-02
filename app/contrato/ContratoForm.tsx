'use client'
import { useState, useRef, useEffect } from 'react'

type ClausulaType = { num: number; titulo: string; resumo: string; texto: string }

type Props = {
  nomeInicial?: string; whatsappInicial?: string; emailInicial?: string; cpfInicial?: string; alunoId?: string
  contratanteNome: string; contratanteCnpj: string; contratanteEndereco: string; foro?: string
  clausulasCustom?: ClausulaType[]
  regraBonificacao?: string
}

type Etapa = 'dados' | 'clausulas' | 'confirmar' | 'assinatura' | 'sucesso'

const CLAUSULAS = [
  {
    num: 1, titulo: 'DO OBJETO',
    resumo: 'Entendo que minha atividade é a divulgação e indicação de associados, atuando como intermediário na distribuição, promoção e filiação aos planos da CONTRATANTE no Programa de Auxílio Mútuo – PAM. As garantias são de responsabilidade da CONTRATANTE.',
    texto: 'O respectivo instrumento tem por objeto a prestação de serviços pelo CONTRATADO, na divulgação e indicação de associados, atuando como intermediário na distribuição, promoção e filiação aos planos da CONTRATANTE no PAM. As garantias serão de responsabilidade da CONTRATANTE.',
  },
  {
    num: 2, titulo: 'DAS OBRIGAÇÕES DO CONTRATADO',
    resumo: 'Declaro ciência das minhas obrigações: garantir qualidade, zelar pelo atendimento, receber treinamentos, conhecer o estatuto e cumprir integralmente os objetivos do contrato com fidelidade, sigilo e boa-fé.',
    texto: 'O CONTRATADO se obriga a: I - Garantir a qualidade dos serviços; II - Zelar pelo atendimento aos associados; III - Receber treinamento e cumprir o estatuto da CONTRATANTE. O CONTRATADO poderá usar prestadores autorizados, sendo responsável por eles. É vedado abrir sucursais sem anuência da CONTRATANTE.',
  },
  {
    num: 3, titulo: 'DA CONDUTA E IDENTIFICAÇÃO VISUAL',
    resumo: 'Estou ciente que é vedado usar o nome, logotipo ou marca da CONTRATANTE sem autorização (multa de R$ 2.000,00 por publicação). Ao usar veículo plotado, represento a Associação e assumo total responsabilidade pela minha conduta no trânsito.',
    texto: 'É vedado ao CONTRATADO utilizar nome, logotipo ou referência da CONTRATANTE em divulgações sem autorização, sob pena de multa de R$ 2.000,00 por impresso/publicação indevida. Ao conduzir veículo plotado, o CONTRATADO representa a Associação e assume responsabilidade por infrações, multas e danos.',
  },
  {
    num: 4, titulo: 'DO PREÇO E CONDIÇÕES DE PAGAMENTO',
    resumo: 'Estou ciente que minha remuneração é variável, baseada em bonificação por filiações (tabela no contrato). Se o filiado não pagar o 1º boleto, será descontada 1 placa da minha meta. Com 300 veículos ativos tenho direito a recorrência de 5%-10%. Com 50/100 filiações e carro plotado, recebo bônus adicional (com obrigação de 6 meses de plotagem).',
    texto: 'Remuneração variável por filiações: tabela de bonificação de R$500 (10 filiações) a R$10.400 (200 filiações). Bônus plotagem: R$1.000 (50 filiações) e R$2.000 (100 filiações) — mínimo 6 meses ou devolução integral. Recorrência de 5%-10% com 300+ veículos ativos. Bônus PBP equipe de R$1.200 a R$10.000.',
  },
  {
    num: 5, titulo: 'DO PRAZO E DA VALIDADE',
    resumo: 'Declaro ciência que este contrato tem prazo de 24 (vinte e quatro) meses a partir da assinatura. Pode ser rescindido sem ônus com comunicação prévia de 5 (cinco) dias.',
    texto: 'O contrato vigorará por 24 meses da data de assinatura. Pode ser denunciado sem ônus com antecedência de 5 dias pela parte interessada.',
  },
  {
    num: 6, titulo: 'DO SIGILO E NÃO CONCORRÊNCIA',
    resumo: 'Aceito a EXCLUSIVIDADE com a CONTRATANTE em âmbito nacional e o sigilo de 5 ANOS após o término do contrato. Estou ciente que o descumprimento implica multa de 40 SALÁRIOS MÍNIMOS (corrigidos pelo INPC) + perdas e danos. Tentativas de retirada de associados resultam em rescisão imediata com a mesma multa.',
    texto: 'EXCLUSIVIDADE nacional durante a vigência. Sigilo de 5 anos após o término — informações operacionais, estratégias, valores. Multa de 40 salários mínimos (INPC) por descumprimento de confidencialidade ou exclusividade. Tentativa de retirada de associados = rescisão imediata + multa de 40 salários mínimos.',
  },
  {
    num: 7, titulo: 'DA LGPD — PROTEÇÃO DE DADOS',
    resumo: 'Compreendo e aceito que dados pessoais serão coletados e tratados exclusivamente para cumprir este contrato, nos termos da Lei 14.909/2021 e LGPD. Os dados não serão compartilhados para outros fins. Comprometo-me a observar as obrigações da LGPD durante toda a vigência.',
    texto: 'Dados pessoais serão tratados exclusivamente para prestação dos serviços, conforme Art. 7º incisos II e V da LGPD. Nenhum dado será compartilhado com terceiros sem instrução da CONTRATANTE. Ambas as partes observam os direitos e obrigações da LGPD.',
  },
  {
    num: 8, titulo: 'DA RESCISÃO',
    resumo: 'Estou ciente dos motivos de rescisão: desídia (incluindo inatividade superior a 10 dias), descrédito da CONTRATANTE, uso indevido da marca, promessas irregulares ao associado, concorrência desleal, ou uso de cadastro de terceiros para filiações (fraude — multa de 40 salários mínimos). Ao término, devo devolver todos os materiais e retirar a plotagem em 24h.',
    texto: 'Motivos de rescisão: desídia, inatividade +10 dias, falsa afirmação, desvio de associados, uso fraudulento de cadastros de terceiros (multa 40 salários mínimos). Ao término: devolver documentos, cessar uso da marca, retirar plotagem em 24h.',
  },
  {
    num: 9, titulo: 'DISPOSIÇÕES GERAIS E ASSINATURA ELETRÔNICA',
    resumo: 'Declaro que: (1) Não tenho vínculo empregatício com a CONTRATANTE; (2) Aceito o foro de Petrolina/PE para dirimir controvérsias; (3) Reconheço que esta assinatura eletrônica tem o mesmo valor legal que a assinatura manual, nos termos da MP 2.200-2/2001, Art. 107 CC e Lei 14.063/2020.',
    texto: 'Sem vínculo empregatício ou de subordinação. Aceitação eletrônica com valor legal equivalente à assinatura manual (MP 2.200-2/2001, Art. 107 CC, Lei 14.063/2020). Foro: Petrolina/PE.',
  },
]

function validarCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g,'')
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false
  let sum = 0; let len = d.length - 2; let pos = len - 7
  for (let i = len; i >= 1; i--) { sum += parseInt(d[len-i]) * pos--; if (pos < 2) pos = 9 }
  let r = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (r !== parseInt(d[len])) return false
  len++; sum = 0; pos = len - 7
  for (let i = len; i >= 1; i--) { sum += parseInt(d[len-i]) * pos--; if (pos < 2) pos = 9 }
  r = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return r === parseInt(d[len])
}

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g,'')
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
  let r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
  if (r !== parseInt(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
  r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
  return r === parseInt(d[10])
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function validarWhatsApp(wpp: string): boolean {
  const d = wpp.replace(/\D/g,'')
  return d.length >= 10 && d.length <= 13
}

function formatarCNPJ(v: string): string {
  const d = v.replace(/\D/g,'').slice(0,14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
}

function formatarCPF(v: string): string {
  const d = v.replace(/\D/g,'').slice(0,11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

function formatarWhatsApp(v: string): string {
  const d = v.replace(/\D/g,'').slice(0,11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

export default function ContratoForm({ nomeInicial='', whatsappInicial='', emailInicial='', cpfInicial='', alunoId, contratanteNome, contratanteCnpj, contratanteEndereco, foro, clausulasCustom, regraBonificacao }: Props) {
  const CLAUSULAS_ATIVAS: ClausulaType[] = clausulasCustom?.length ? clausulasCustom : CLAUSULAS
  const [etapa, setEtapa] = useState<Etapa>('dados')
  const [clausulaAtual, setClausulaAtual] = useState(0)
  const [aceitas, setAceitas] = useState<boolean[]>(new Array(CLAUSULAS_ATIVAS.length).fill(false))
  const [form, setForm] = useState({ nome: nomeInicial, whatsapp: whatsappInicial, email: emailInicial, cpf: cpfInicial, cnpj_mei: '', sede_mei: '', rua: '', numero: '', bairro: '', cidade: '', estado: '', cep: '' })
  const [buscandoCep, setBuscandoCep] = useState(false)

  async function buscarCep(cep: string) {
    const limpo = cep.replace(/\D/g, '')
    if (limpo.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm(p => ({ ...p, rua: data.logradouro || p.rua, bairro: data.bairro || p.bairro, cidade: data.localidade || p.cidade, estado: data.uf || p.estado }))
      }
    } catch { /* ignora erros de rede */ }
    setBuscandoCep(false)
  }
  const [dataNascimento, setDataNascimento] = useState('')
  const [estadoCivil, setEstadoCivil] = useState('')
  const [nacionalidade, setNacionalidade] = useState('Brasileiro(a)')
  // Nota Fiscal
  const [nfEmiteProprio, setNfEmiteProprio] = useState<boolean | null>(null)
  const [nfEmpresaNome, setNfEmpresaNome] = useState('')
  const [nfEmpresaCnpj, setNfEmpresaCnpj] = useState('')
  const [nfResponsavelNome, setNfResponsavelNome] = useState('')
  const [nfResponsavelCpf, setNfResponsavelCpf] = useState('')
  const [semCnpj, setSemCnpj] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState<{ numero_registro: string; hash_contrato: string } | null>(null)

  // Canvas de assinatura
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    if (etapa === 'assinatura') setTimeout(() => setupCanvas(), 50)
  }, [etapa])

  function setupCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.getContext('2d')!.scale(dpr, dpr)
  }

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    if (canvas.width === 0) setupCanvas()
    isDrawing.current = true
    const pos = getPos(e, canvas)
    const ctx = canvas.getContext('2d')!
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1e3a8a'
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
    setHasSignature(true)
  }

  function stopDraw() { isDrawing.current = false }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    setHasSignature(false)
  }

  const bg = '#0a0a0f'
  const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }
  const lbl: React.CSSProperties = { display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }

  const sedeMei = `${form.rua}, ${form.numero} — ${form.bairro}, ${form.cidade}/${form.estado}, CEP ${form.cep}`.replace(/^,\s*|,\s*—\s*,|,\s*\/|CEP\s*$/g,'')

  async function assinar() {
    setLoading(true); setErro('')
    const nfDados = nfEmiteProprio === false ? {
      emite_proprio: false,
      empresa_nome: nfEmpresaNome,
      empresa_cnpj: nfEmpresaCnpj.replace(/\D/g,''),
      responsavel_nome: nfResponsavelNome,
      responsavel_cpf: nfResponsavelCpf.replace(/\D/g,''),
    } : { emite_proprio: true }

    const assinatura_base64 = canvasRef.current?.toDataURL('image/png') ?? null

    const res = await fetch('/api/contrato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome, cpf: form.cpf,
        cnpj_mei: semCnpj ? '' : form.cnpj_mei,
        sede_mei: semCnpj ? '' : sedeMei,
        sem_cnpj: semCnpj,
        whatsapp: form.whatsapp, email: form.email,
        data_nascimento: dataNascimento, estado_civil: estadoCivil, nacionalidade,
        aluno_id: alunoId ?? null,
        clausulas_aceitas: CLAUSULAS_ATIVAS.map(c => c.titulo),
        nf_dados: semCnpj ? null : nfDados,
        assinatura_base64,
        regra_bonificacao: regraBonificacao ?? null,
      }),
    })
    const data = await res.json()
    if (data.ok) { setResultado(data); setEtapa('sucesso') }
    else setErro(data.error ?? 'Erro ao registrar contrato.')
    setLoading(false)
  }

  // ── ETAPA 1: DADOS ────────────────────────────────────────────────────────
  if (etapa === 'dados') {
    const dataNascOk = dataNascimento.length === 10
    const cnpjValido = validarCNPJ(form.cnpj_mei)
    const cnpjLen = form.cnpj_mei.replace(/\D/g,'').length
    const cpfLen = form.cpf.replace(/\D/g,'').length
    const cpfValido = cpfLen === 0 || validarCPF(form.cpf)
    const wppLen = form.whatsapp.replace(/\D/g,'').length
    const wppValido = validarWhatsApp(form.whatsapp)
    const emailOk = !form.email || validarEmail(form.email)
    const nfCnpjLen = nfEmpresaCnpj.replace(/\D/g,'').length
    const nfCnpjValido = nfCnpjLen === 0 || validarCNPJ(nfEmpresaCnpj)
    const nfCpfLen = nfResponsavelCpf.replace(/\D/g,'').length
    const nfCpfValido = nfCpfLen === 0 || validarCPF(nfResponsavelCpf)
    const nfOk = nfEmiteProprio === true || (nfEmiteProprio === false && nfEmpresaNome && nfCnpjValido && nfResponsavelNome)
    const cnpjOk = semCnpj || (!!form.cnpj_mei && cnpjValido)
    const enderecoOk = semCnpj || !!(form.rua && form.numero && form.bairro && form.cidade && form.estado && form.cep)
    const nfFinal = semCnpj || (nfEmiteProprio !== null && !!nfOk)
    const podeAvancar = !!(form.nome && wppValido && cnpjOk && emailOk && cpfValido && dataNascOk && estadoCivil && nacionalidade && enderecoOk && nfFinal)
    return (
      <div style={{ minHeight:'100vh', background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', padding:'32px 20px' }}>
        <div style={{ width:'100%', maxWidth:580 }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ display:'inline-block', background:'rgba(99,102,241,0.12)', border:'2px solid #6366f1', borderRadius:16, padding:'12px 32px', marginBottom:16 }}>
              <p style={{ fontWeight:900, fontSize:14, color:'#818cf8', margin:0, letterSpacing:2, textTransform:'uppercase' }}>Contrato de Representação</p>
              <p style={{ fontWeight:800, fontSize:22, color:'#fff', margin:'6px 0 0' }}>{contratanteNome}</p>
            </div>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14, lineHeight:1.6 }}>Preencha seus dados para gerar o contrato</p>
          </div>

          <div style={{ background:'rgba(10,22,40,0.85)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:20, padding:32, backdropFilter:'blur(12px)' }}>
            <p style={{ fontWeight:700, fontSize:14, color:'#818cf8', marginBottom:20 }}>📋 Seus dados pessoais</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lbl}>Nome completo *</label>
                <input style={inp} value={form.nome} onChange={e => setForm(p=>({...p,nome:e.target.value}))} placeholder="Seu nome completo" />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>
                    WhatsApp *
                    {wppLen >= 10 && (
                      <span style={{ marginLeft:8, color: wppValido ? '#22c55e' : '#f87171', fontWeight:700 }}>
                        {wppValido ? '✓ válido' : '✗ inválido'}
                      </span>
                    )}
                  </label>
                  <input
                    style={{...inp, borderColor: wppLen >= 10 && !wppValido ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.15)'}}
                    value={form.whatsapp}
                    onChange={e => setForm(p=>({...p,whatsapp:formatarWhatsApp(e.target.value)}))}
                    placeholder="(87) 99999-9999" />
                </div>
                <div>
                  <label style={lbl}>
                    CPF
                    {cpfLen === 11 && (
                      <span style={{ marginLeft:8, color: cpfValido ? '#22c55e' : '#f87171', fontWeight:700 }}>
                        {cpfValido ? '✓ válido' : '✗ inválido'}
                      </span>
                    )}
                  </label>
                  <input
                    style={{...inp, borderColor: cpfLen === 11 && !cpfValido ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.15)'}}
                    value={form.cpf}
                    onChange={e => setForm(p=>({...p,cpf:formatarCPF(e.target.value)}))}
                    placeholder="000.000.000-00" />
                </div>
              </div>
              <div>
                <label style={lbl}>
                  E-mail
                  {form.email.length > 4 && (
                    <span style={{ marginLeft:8, color: emailOk ? '#22c55e' : '#f87171', fontWeight:700 }}>
                      {emailOk ? '✓ válido' : '✗ inválido'}
                    </span>
                  )}
                </label>
                <input
                  style={{...inp, borderColor: form.email.length > 4 && !emailOk ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.15)'}}
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p=>({...p,email:e.target.value}))}
                  placeholder="seu@email.com" />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>
                    Data de nascimento *
                    {dataNascimento.length > 0 && dataNascimento.length < 10 && (
                      <span style={{ marginLeft:6, color:'#f87171', fontWeight:700 }}>✗</span>
                    )}
                    {dataNascimento.length === 10 && (
                      <span style={{ marginLeft:6, color:'#22c55e', fontWeight:700 }}>✓</span>
                    )}
                  </label>
                  <input
                    style={{...inp, borderColor: dataNascimento.length > 0 && dataNascimento.length < 10 ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.15)'}}
                    type="date"
                    value={dataNascimento}
                    onChange={e => setDataNascimento(e.target.value)}
                    max={new Date(Date.now() - 18*365*24*60*60*1000).toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label style={lbl}>Estado civil *</label>
                  <select
                    style={{...inp, cursor:'pointer'}}
                    value={estadoCivil}
                    onChange={e => setEstadoCivil(e.target.value)}>
                    <option value="">Selecione</option>
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                    <option value="União estável">União estável</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Nacionalidade *</label>
                  <input
                    style={inp}
                    value={nacionalidade}
                    onChange={e => setNacionalidade(e.target.value)}
                    placeholder="Brasileiro(a)" />
                </div>
              </div>
            </div>

            <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontWeight:700, fontSize:14, color:'#818cf8', marginBottom:16 }}>🏢 Dados do CNPJ</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={lbl}>
                    CNPJ {semCnpj ? '' : '*'}
                    {!semCnpj && cnpjLen === 14 && (
                      <span style={{ marginLeft:8, color: cnpjValido ? '#22c55e' : '#f87171', fontWeight:700 }}>
                        {cnpjValido ? '✓ válido' : '✗ inválido'}
                      </span>
                    )}
                  </label>
                  {!semCnpj && (
                    <input style={{...inp, borderColor: cnpjLen===14 && !cnpjValido ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.15)'}}
                      value={form.cnpj_mei} onChange={e => setForm(p=>({...p,cnpj_mei:formatarCNPJ(e.target.value)}))} placeholder="00.000.000/0000-00" />
                  )}
                  <label style={{ display:'flex', alignItems:'center', gap:10, marginTop:10, cursor:'pointer' }}>
                    <div style={{ width:20, height:20, borderRadius:4, border:`2px solid ${semCnpj ? '#6366f1' : 'rgba(255,255,255,0.25)'}`, background: semCnpj ? '#6366f1' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' }}>
                      {semCnpj && <span style={{ color:'#fff', fontSize:12, fontWeight:900, lineHeight:1 }}>✓</span>}
                    </div>
                    <input type="checkbox" checked={semCnpj} onChange={e => { setSemCnpj(e.target.checked); if (e.target.checked) setForm(p => ({ ...p, cnpj_mei: '', rua: '', numero: '', bairro: '', cidade: '', estado: '', cep: '' })) }} style={{ display:'none' }} />
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Ainda não tenho CNPJ</span>
                  </label>
                </div>
                {!semCnpj && <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:-8 }}>Endereço da sede do MEI:</p>}
                {!semCnpj && (
                  <>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 100px', gap:12 }}>
                      <div>
                        <label style={lbl}>Rua / Avenida *</label>
                        <input style={inp} value={form.rua} onChange={e => setForm(p=>({...p,rua:e.target.value}))} placeholder="Rua das Flores" />
                      </div>
                      <div>
                        <label style={lbl}>Número *</label>
                        <input style={inp} value={form.numero} onChange={e => setForm(p=>({...p,numero:e.target.value}))} placeholder="123" />
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div>
                        <label style={lbl}>Bairro *</label>
                        <input style={inp} value={form.bairro} onChange={e => setForm(p=>({...p,bairro:e.target.value}))} placeholder="Centro" />
                      </div>
                      <div>
                        <label style={lbl}>CEP * {buscandoCep && <span style={{ fontWeight: 400, fontSize: 11, color: '#818cf8' }}>buscando...</span>}</label>
                        <input style={inp} value={form.cep}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
                            setForm(p => ({ ...p, cep: val }))
                            buscarCep(val)
                          }}
                          placeholder="00000-000" maxLength={9} />
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:12 }}>
                      <div>
                        <label style={lbl}>Cidade *</label>
                        <input style={inp} value={form.cidade} onChange={e => setForm(p=>({...p,cidade:e.target.value}))} placeholder="Petrolina" />
                      </div>
                      <div>
                        <label style={lbl}>UF *</label>
                        <input style={inp} value={form.estado} onChange={e => setForm(p=>({...p,estado:e.target.value.toUpperCase().slice(0,2)}))} placeholder="PE" maxLength={2} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Nota Fiscal */}
            {!semCnpj && <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontWeight:700, fontSize:14, color:'#818cf8', marginBottom:6 }}>🧾 Emissão de Nota Fiscal</p>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:14, lineHeight:1.6 }}>Informe como será feita a emissão de notas fiscais pelos seus serviços.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { val: true, label:'✅ Sim, eu mesmo emito minha Nota Fiscal', sub:'Você emitirá NF pelo seu próprio CNPJ.' },
                  { val: false, label:'⚠️ Não consigo emitir NF — outra empresa/pessoa emitirá por mim', sub:'Você autoriza outra empresa a emitir e receber em seu nome.' },
                ].map(op => (
                  <label key={String(op.val)} style={{ display:'flex', gap:12, alignItems:'flex-start', background: nfEmiteProprio === op.val ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)', border:`1px solid ${nfEmiteProprio === op.val ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.12)'}`, borderRadius:10, padding:'14px 16px', cursor:'pointer' }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${nfEmiteProprio === op.val ? '#6366f1' : 'rgba(255,255,255,0.25)'}`, background: nfEmiteProprio === op.val ? '#6366f1' : 'transparent', flexShrink:0, marginTop:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {nfEmiteProprio === op.val && <span style={{ width:8, height:8, borderRadius:'50%', background:'#fff', display:'block' }} />}
                    </div>
                    <input type="radio" name="nfEmite" style={{ display:'none' }} onChange={() => setNfEmiteProprio(op.val)} />
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color:'#fff', margin:0 }}>{op.label}</p>
                      <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)', margin:'3px 0 0' }}>{op.sub}</p>
                    </div>
                  </label>
                ))}
              </div>

              {nfEmiteProprio === false && (
                <div style={{ marginTop:14, background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:10, padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
                  <p style={{ fontSize:12, color:'rgba(251,191,36,0.9)', fontWeight:700, margin:0 }}>⚠️ Preencha os dados de quem vai emitir e receber por você:</p>
                  <div>
                    <label style={lbl}>Razão social da empresa emissora *</label>
                    <input style={inp} value={nfEmpresaNome} onChange={e => setNfEmpresaNome(e.target.value)} placeholder="Ex: ABC Serviços Ltda" />
                  </div>
                  <div>
                    <label style={lbl}>
                      CNPJ da empresa emissora *
                      {nfCnpjLen === 14 && (
                        <span style={{ marginLeft:8, color: nfCnpjValido ? '#22c55e' : '#f87171', fontWeight:700 }}>
                          {nfCnpjValido ? '✓ válido' : '✗ inválido'}
                        </span>
                      )}
                    </label>
                    <input
                      style={{...inp, borderColor: nfCnpjLen === 14 && !nfCnpjValido ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.15)'}}
                      value={nfEmpresaCnpj}
                      onChange={e => setNfEmpresaCnpj(formatarCNPJ(e.target.value))}
                      placeholder="00.000.000/0001-00" />
                  </div>
                  <div>
                    <label style={lbl}>Nome do responsável que receberá em seu nome *</label>
                    <input style={inp} value={nfResponsavelNome} onChange={e => setNfResponsavelNome(e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div>
                    <label style={lbl}>
                      CPF do responsável
                      {nfCpfLen === 11 && (
                        <span style={{ marginLeft:8, color: nfCpfValido ? '#22c55e' : '#f87171', fontWeight:700 }}>
                          {nfCpfValido ? '✓ válido' : '✗ inválido'}
                        </span>
                      )}
                    </label>
                    <input
                      style={{...inp, borderColor: nfCpfLen === 11 && !nfCpfValido ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.15)'}}
                      value={nfResponsavelCpf}
                      onChange={e => setNfResponsavelCpf(formatarCPF(e.target.value))}
                      placeholder="000.000.000-00" />
                  </div>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', margin:0, lineHeight:1.6 }}>
                    Ao assinar este contrato, você autoriza expressamente a empresa e o responsável acima a emitir notas fiscais e receber pagamentos em seu nome, conforme pactuado neste instrumento.
                  </p>
                </div>
              )}
            </div>}

            <button onClick={() => setEtapa('clausulas')} disabled={!podeAvancar}
              className="btn btn-primary btn-full btn-lg" style={{ marginTop: 24 }}>
              Avançar para o Contrato →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── ETAPA 2: CLÁUSULAS ────────────────────────────────────────────────────
  if (etapa === 'clausulas') {
    const cl = CLAUSULAS_ATIVAS[clausulaAtual]
    const total = CLAUSULAS_ATIVAS.length
    const pct = Math.round((clausulaAtual / total) * 100)
    return (
      <div style={{ minHeight:'100vh', background:bg, fontFamily:'Inter,sans-serif', padding:'32px 20px' }}>
        <div style={{ maxWidth:640, margin:'0 auto' }}>
          {/* Progress */}
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <p style={{ fontWeight:900, fontSize:14, color:'#6366f1', letterSpacing:2, textTransform:'uppercase', margin:'0 0 4px' }}>Contrato de Representação</p>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, margin:0 }}>Cláusula {clausulaAtual+1} de {total} — {total - clausulaAtual - 1 > 0 ? `${total - clausulaAtual - 1} restantes` : 'última cláusula'}</p>
          </div>

          {/* Barra de progresso */}
          <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:100, height:8, marginBottom:28, overflow:'hidden' }}>
            <div style={{ width:`${pct + (100/total)}%`, height:'100%', background:'#4f46e5', borderRadius:100, transition:'width 0.4s' }} />
          </div>

          {/* Card da cláusula */}
          <div style={{ background:'rgba(10,22,40,0.85)', border:`1px solid ${aceitas[clausulaAtual] ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.12)'}`, borderRadius:20, padding:'28px 28px', backdropFilter:'blur(12px)', transition:'border-color 0.3s' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(99,102,241,0.15)', border:'2px solid #6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:16, color:'#818cf8', flexShrink:0 }}>
                {cl.num}
              </div>
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:'#6366f1', letterSpacing:1, textTransform:'uppercase', margin:0 }}>Seção {cl.num}</p>
                <p style={{ fontWeight:800, fontSize:17, color:'#fff', margin:'2px 0 0' }}>{cl.titulo}</p>
              </div>
            </div>

            {/* Texto completo */}
            <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'16px 18px', marginBottom:20, maxHeight:200, overflowY:'auto', border:'1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.8, margin:0 }}>{cl.texto}</p>
            </div>

            {/* Checkbox de aceitação */}
            <label style={{ display:'flex', gap:14, alignItems:'flex-start', background: aceitas[clausulaAtual] ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)', border:`1px solid ${aceitas[clausulaAtual] ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.12)'}`, borderRadius:12, padding:'16px 18px', cursor:'pointer', transition:'all 0.2s' }}>
              <div style={{ width:24, height:24, borderRadius:6, border:`2px solid ${aceitas[clausulaAtual] ? '#6366f1' : 'rgba(255,255,255,0.25)'}`, background: aceitas[clausulaAtual] ? '#6366f1' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1, transition:'all 0.2s' }}>
                {aceitas[clausulaAtual] && <span style={{ color:'#fff', fontSize:14, fontWeight:900 }}>✓</span>}
              </div>
              <input type="checkbox" checked={aceitas[clausulaAtual]} onChange={e => { const n=[...aceitas]; n[clausulaAtual]=e.target.checked; setAceitas(n) }} style={{ display:'none' }} />
              <div>
                <p style={{ fontSize:11, color:'#818cf8', fontWeight:700, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:0.8 }}>Estou ciente e de acordo</p>
                <p style={{ fontSize:13, color: aceitas[clausulaAtual] ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)', lineHeight:1.6, margin:0 }}>{cl.resumo}</p>
              </div>
            </label>
          </div>

          {/* Botões */}
          <div style={{ display:'flex', gap:12, marginTop:20 }}>
            <button onClick={() => clausulaAtual === 0 ? setEtapa('dados') : setClausulaAtual(c => c-1)}
              className="btn btn-ghost" style={{ flex: 1, fontSize: 15 }}>
              ← Voltar
            </button>
            {clausulaAtual < CLAUSULAS_ATIVAS.length - 1 ? (
              <button onClick={() => setClausulaAtual(c => c+1)} disabled={!aceitas[clausulaAtual]}
                className="btn btn-primary" style={{ flex: 2, fontSize: 16 }}>
                Próxima cláusula →
              </button>
            ) : (
              <button onClick={() => setEtapa('confirmar')} disabled={!aceitas[clausulaAtual]}
                className="btn btn-primary" style={{ flex: 2, fontSize: 16 }}>
                Revisar e Assinar
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── ETAPA 3: CONFIRMAR ────────────────────────────────────────────────────
  if (etapa === 'confirmar') {
    const dadosConfirmar: [string, string][] = [
      ['CONTRATANTE', `${contratanteNome} · CNPJ ${contratanteCnpj}`],
      ['CONTRATADO', form.nome.toUpperCase()],
      ['NASCIMENTO', dataNascimento ? new Date(dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'],
      ['ESTADO CIVIL', estadoCivil || '—'],
      ['NACIONALIDADE', nacionalidade || '—'],
      ['CPF', form.cpf || '—'],
      ['CNPJ MEI', semCnpj ? 'Pendente — sera informado apos abertura' : form.cnpj_mei],
    ]
    if (!semCnpj) dadosConfirmar.push(['SEDE MEI', sedeMei])
    dadosConfirmar.push(
      ['WhatsApp', form.whatsapp],
      ['E-mail', form.email || '—'],
      ['Prazo', '24 meses a partir da assinatura'],
      ['Foro', foro || 'Petrolina/PE'],
    )
    if (!semCnpj) dadosConfirmar.push(['Nota Fiscal', nfEmiteProprio ? 'Emitida pelo proprio MEI' : `Emitida por: ${nfEmpresaNome} — Recebe: ${nfResponsavelNome}`])
    return (
      <div style={{ minHeight:'100vh', background:bg, fontFamily:'Inter,sans-serif', padding:'32px 20px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ maxWidth:600, width:'100%' }}>
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{ fontSize:52, marginBottom:12 }}>✍️</div>
            <p style={{ fontWeight:900, fontSize:22, color:'#fff', margin:'0 0 8px' }}>Revisão final</p>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14 }}>Confirme seus dados antes de assinar</p>
          </div>

          <div style={{ background:'rgba(10,22,40,0.85)', border:'1px solid rgba(79,70,229,0.3)', borderRadius:20, padding:28, marginBottom:20 }}>
            <p style={{ fontWeight:700, fontSize:13, color:'#818cf8', marginBottom:16 }}>📋 Dados do contrato</p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {dadosConfirmar.map(([l,v]) => (
                <div key={l} style={{ display:'flex', gap:12, padding:'10px 14px', background:'rgba(255,255,255,0.03)', borderRadius:10 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:0.8, flexShrink:0, width:100 }}>{l}</span>
                  <span style={{ fontSize:13, color:'#fff', flex:1 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop:16, padding:'12px 16px', background:'rgba(99,102,241,0.08)', borderRadius:10, border:'1px solid rgba(99,102,241,0.2)' }}>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', margin:'0 0 4px', fontWeight:700 }}>✅ Todas as {CLAUSULAS_ATIVAS.length} cláusulas aceitas</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', margin:0 }}>Assinatura eletrônica com hash SHA-256 — validade jurídica conforme MP 2.200-2/2001</p>
            </div>
          </div>

          {erro && (
            <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:10, padding:'12px 16px', color:'#f87171', fontSize:14, marginBottom:16 }}>
              {erro}
            </div>
          )}

          <div style={{ display:'flex', gap:12 }}>
            <button onClick={() => { setClausulaAtual(CLAUSULAS_ATIVAS.length-1); setEtapa('clausulas') }}
              className="btn btn-ghost" style={{ flex: 1, fontSize: 15 }}>
              ← Rever
            </button>
            <button onClick={() => { setHasSignature(false); setEtapa('assinatura') }}
              className="btn btn-primary" style={{ flex: 2, fontSize: 16 }}>
              Prosseguir para Assinatura →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── ETAPA 4: ASSINATURA ───────────────────────────────────────────────────
  if (etapa === 'assinatura') {
    return (
      <div style={{ minHeight:'100vh', background:bg, fontFamily:'Inter,sans-serif', padding:'32px 20px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ maxWidth:560, width:'100%' }}>
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <p style={{ fontWeight:900, fontSize:22, color:'#fff', margin:'0 0 8px' }}>Assine o contrato</p>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14 }}>Desenhe sua assinatura no campo abaixo</p>
          </div>

          <div style={{ background:'rgba(10,22,40,0.85)', border:'1px solid rgba(79,70,229,0.3)', borderRadius:20, padding:28, marginBottom:20 }}>
            {/* Canvas */}
            <div style={{ border:`2px solid ${hasSignature ? '#6366f1' : 'rgba(255,255,255,0.15)'}`, borderRadius:12, overflow:'hidden', background:'#fff', marginBottom:12, transition:'border-color 0.2s' }}>
              <canvas
                ref={canvasRef}
                style={{ width:'100%', height:180, display:'block' }}
                className="cursor-crosshair touch-none"
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
              />
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>{form.nome}</p>
              <button type="button" onClick={clearCanvas} style={{ fontSize:12, color:'rgba(255,255,255,0.45)', background:'none', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, padding:'4px 12px', cursor:'pointer' }}>
                ↺ Limpar
              </button>
            </div>

            <div style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:20 }}>
              <p style={{ fontSize:12, color:'rgba(251,191,36,0.9)', margin:0, lineHeight:1.6 }}>
                Ao confirmar, você registra sua assinatura eletrônica com validade jurídica. Seus dados de acesso (IP, data e hora) serão gravados na trilha de auditoria conforme a <strong>Lei 14.063/2020</strong>.
              </p>
            </div>

            {erro && (
              <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:10, padding:'12px 16px', color:'#f87171', fontSize:14, marginBottom:16 }}>
                {erro}
              </div>
            )}

            <div style={{ display:'flex', gap:12 }}>
              <button onClick={() => setEtapa('confirmar')} className="btn btn-ghost" style={{ flex:1 }}>
                ← Voltar
              </button>
              <button onClick={assinar} disabled={!hasSignature || loading}
                style={{ flex:2, background: hasSignature && !loading ? '#22c55e' : 'rgba(255,255,255,0.1)', color:'#fff', border:'none', borderRadius:10, padding:'14px', fontWeight:700, fontSize:16, cursor: hasSignature && !loading ? 'pointer' : 'not-allowed', transition:'background 0.2s' }}>
                {loading ? 'Registrando...' : '✅ Confirmar Assinatura'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── ETAPA SUCESSO ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:bg, fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 20px' }}>
      <div style={{ textAlign:'center', color:'#fff', maxWidth:520, width:'100%' }}>
        <div style={{ fontSize:72, marginBottom:20 }}>🎉</div>
        <h1 style={{ fontSize:28, fontWeight:900, marginBottom:12 }}>Contrato assinado!</h1>
        <p style={{ color:'rgba(255,255,255,0.6)', fontSize:15, marginBottom:24, lineHeight:1.7 }}>
          Seu contrato foi registrado digitalmente e o PDF será enviado via WhatsApp em instantes.
        </p>
        {resultado && (
          <>
            <div style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:14, padding:'16px 20px', marginBottom:20, textAlign:'left' }}>
              <p style={{ fontSize:11, color:'#818cf8', fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>📄 Registro do contrato</p>
              <p style={{ fontSize:16, fontWeight:800, color:'#fff', margin:'0 0 4px' }}>{resultado.numero_registro}</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', margin:0, fontFamily:'monospace', wordBreak:'break-all' }}>
                SHA-256: {resultado.hash_contrato}
              </p>
            </div>
            <button onClick={() => navigator.clipboard.writeText(resultado.numero_registro).then(() => alert('Registro copiado!'))}
              style={{ background:'rgba(99,102,241,0.15)', border:'1px solid rgba(79,70,229,0.3)', color:'#818cf8', borderRadius:10, padding:'12px 24px', fontWeight:700, fontSize:14, cursor:'pointer' }}>
              Copiar número do registro
            </button>
          </>
        )}
        {whatsappInicial && (
          <a href={`/aluno/${whatsappInicial.replace(/\D/g, '')}`}
            style={{ display:'inline-block', marginTop:24, background:'#22c55e', color:'#fff', borderRadius:10, padding:'13px 28px', fontWeight:700, fontSize:15, textDecoration:'none' }}>
            Ir para o painel
          </a>
        )}
      </div>
    </div>
  )
}

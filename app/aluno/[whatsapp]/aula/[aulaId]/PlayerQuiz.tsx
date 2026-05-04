'use client';

import { useState } from 'react';

interface Alternativa {
  letra: string;
  texto: string;
  correta: boolean;
}

interface Questao {
  id: string;
  ordem: number;
  enunciado: string;
  alternativas: Alternativa[];
  explicacao?: string;
}

interface Aula {
  id: string;
  titulo: string;
  descricao?: string;
  youtube_video_id: string;
  quiz_qtd_questoes: number;
  quiz_aprovacao_minima: number;
  espera_horas: number;
}

interface ResultadoQuiz {
  aprovado: boolean;
  acertos: number;
  total: number;
  percentual: number;
  proxima_liberada_em: string | null;
  erradas: { questao: Questao; letraEscolhida: string }[];
}

type Fase = 'assistindo' | 'quiz' | 'resultado';

function sortearQuestoes(questoes: Questao[], qtd: number): Questao[] {
  const copia = [...questoes];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, Math.min(qtd, copia.length));
}

export default function PlayerQuiz({
  aula,
  questoes,
  alunoId,
  whatsapp,
  jaAssistiu,
}: {
  aula: Aula;
  questoes: Questao[];
  alunoId: string;
  whatsapp: string;
  jaAssistiu: boolean;
}) {
  const [fase, setFase] = useState<Fase>('assistindo');
  const [questoesSorteadas, setQuestoesSorteadas] = useState<Questao[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostas, setRespostas] = useState<{ questao_id: string; letra_escolhida: string }[]>([]);
  const [resultado, setResultado] = useState<ResultadoQuiz | null>(null);
  const [carregando, setCarregando] = useState(false);

  function iniciarQuiz() {
    const sorteadas = sortearQuestoes(questoes, aula.quiz_qtd_questoes);
    setQuestoesSorteadas(sorteadas);
    setIndiceAtual(0);
    setRespostas([]);
    setResultado(null);
    setFase('quiz');
  }

  async function responder(letra: string) {
    const questaoAtual = questoesSorteadas[indiceAtual];
    const novasRespostas = [...respostas, { questao_id: questaoAtual.id, letra_escolhida: letra }];
    setRespostas(novasRespostas);

    if (indiceAtual + 1 < questoesSorteadas.length) {
      setTimeout(() => setIndiceAtual(i => i + 1), 400);
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aluno_id: alunoId, aula_id: aula.id, respostas: novasRespostas }),
      });
      const data = await res.json();

      const erradas: ResultadoQuiz['erradas'] = [];
      for (const resp of novasRespostas) {
        const q = questoesSorteadas.find(q => q.id === resp.questao_id);
        if (!q) continue;
        const correta = q.alternativas.find(a => a.correta);
        if (correta && correta.letra !== resp.letra_escolhida) {
          erradas.push({ questao: q, letraEscolhida: resp.letra_escolhida });
        }
      }

      setResultado({ ...data, erradas });
      setFase('resultado');
    } finally {
      setCarregando(false);
    }
  }

  if (fase === 'assistindo') {
    return (
      <div style={{ padding: '32px 5%', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
          <iframe
            src={`https://www.youtube.com/embed/${aula.youtube_video_id}?rel=0&modestbranding=1`}
            title={aula.titulo}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <h1 style={{ fontFamily: 'Inter', fontSize: 'clamp(22px, 3vw, 32px)', letterSpacing: 2, marginBottom: 8 }}>
          {aula.titulo}
        </h1>
        {aula.descricao && (
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{aula.descricao}</p>
        )}
        {questoes.length > 0 && (
          <button
            onClick={iniciarQuiz}
            style={{
              padding: '12px 28px',
              background: 'var(--grad-brand)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            Já assisti, fazer o quiz
          </button>
        )}
      </div>
    );
  }

  if (fase === 'quiz') {
    const questaoAtual = questoesSorteadas[indiceAtual];
    const jaRespondeu = respostas.length > indiceAtual;
    const letraEscolhida = jaRespondeu ? respostas[indiceAtual].letra_escolhida : null;

    return (
      <div style={{ padding: '32px 5%', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h2 style={{ fontFamily: 'Inter', fontSize: 20, letterSpacing: 2, margin: 0 }}>Quiz — {aula.titulo}</h2>
            <span style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>
              Questão {indiceAtual + 1} de {questoesSorteadas.length}
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--avp-border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((indiceAtual + 1) / questoesSorteadas.length) * 100}%`, background: 'var(--grad-brand)', transition: 'width 0.3s' }} />
          </div>
        </div>

        {carregando ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--avp-text-dim)' }}>Calculando resultado...</div>
        ) : (
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 28 }}>
            <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24, fontWeight: 500 }}>{questaoAtual.enunciado}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {questaoAtual.alternativas.map(alt => {
                let bg = 'var(--avp-card-hover)';
                let border = 'var(--avp-border)';
                if (letraEscolhida === alt.letra) {
                  bg = 'rgba(51,54,135,0.4)';
                  border = 'var(--avp-blue-bright)';
                }
                return (
                  <button
                    key={alt.letra}
                    disabled={jaRespondeu}
                    onClick={() => responder(alt.letra)}
                    style={{
                      padding: '12px 16px',
                      background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: 8,
                      color: 'var(--avp-text)',
                      textAlign: 'left',
                      fontSize: 14,
                      lineHeight: 1.5,
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--avp-text-dim)', minWidth: 20 }}>{alt.letra}.</span>
                    {alt.texto}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (fase === 'resultado' && resultado) {
    return (
      <div style={{ padding: '32px 5%', maxWidth: 720, margin: '0 auto' }}>
        <div style={{
          background: 'var(--avp-card)',
          border: `1px solid ${resultado.aprovado ? 'var(--avp-green)' : 'var(--avp-danger)'}`,
          borderRadius: 12,
          padding: 32,
          marginBottom: 24,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{resultado.aprovado ? '🎉' : '😅'}</div>
          <h2 style={{ fontFamily: 'Inter', fontSize: 28, letterSpacing: 2, marginBottom: 8, color: resultado.aprovado ? 'var(--avp-green)' : 'var(--avp-danger)' }}>
            {resultado.aprovado ? 'Parabéns!' : 'Quase lá!'}
          </h2>
          <p style={{ fontSize: 18, marginBottom: 4 }}>
            Você acertou <strong>{resultado.acertos}</strong> de <strong>{resultado.total}</strong>
          </p>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 20 }}>
            {resultado.aprovado
              ? resultado.proxima_liberada_em
                ? `Próxima aula disponível em ${new Date(resultado.proxima_liberada_em).toLocaleString('pt-BR')}`
                : 'Próxima aula já disponível!'
              : `Mínimo exigido: ${aula.quiz_aprovacao_minima}%`}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={`/aluno/${whatsapp}`}
              style={{
                padding: '10px 24px',
                background: 'var(--avp-border)',
                color: 'var(--avp-text)',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Voltar para trilha
            </a>
            {!resultado.aprovado && (
              <button
                onClick={iniciarQuiz}
                style={{
                  padding: '10px 24px',
                  background: 'var(--grad-brand)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Tentar novamente
              </button>
            )}
          </div>
        </div>

        {resultado.erradas.length > 0 && (
          <div>
            <h3 style={{ fontFamily: 'Inter', fontSize: 20, letterSpacing: 2, marginBottom: 16 }}>Questões erradas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {resultado.erradas.map(({ questao, letraEscolhida }) => {
                const correta = questao.alternativas.find(a => a.correta);
                const escolhida = questao.alternativas.find(a => a.letra === letraEscolhida);
                return (
                  <div key={questao.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: 20 }}>
                    <p style={{ fontWeight: 500, marginBottom: 12, lineHeight: 1.5 }}>{questao.enunciado}</p>
                    <p style={{ fontSize: 13, color: 'var(--avp-danger)', marginBottom: 4 }}>
                      Sua resposta: <strong>{letraEscolhida}. {escolhida?.texto}</strong>
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--avp-green)', marginBottom: questao.explicacao ? 8 : 0 }}>
                      Correta: <strong>{correta?.letra}. {correta?.texto}</strong>
                    </p>
                    {questao.explicacao && (
                      <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: 6, marginTop: 8, lineHeight: 1.5 }}>
                        {questao.explicacao}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

'use client';

import { useEffect, useState } from 'react';

interface AulaTrilha {
  aula_id: string;
  aula_titulo: string;
  aula_ordem: number;
  youtube_video_id: string;
  duracao_minutos: number | null;
  status: 'disponivel' | 'concluida' | 'aguardando_tempo' | 'bloqueada';
  liberada_em: string | null;
  publicado: boolean;
  modulo_id: string;
  modulo_titulo: string;
  modulo_ordem: number;
}

interface ModuloGroup {
  modulo_id: string;
  modulo_titulo: string;
  modulo_ordem: number;
  aulas: AulaTrilha[];
}

function useCountdown(isoDate: string | null) {
  const [tempo, setTempo] = useState('');

  useEffect(() => {
    if (!isoDate) return;

    function calcular() {
      const diff = new Date(isoDate!).getTime() - Date.now();
      if (diff <= 0) { setTempo(''); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTempo(`${h}h ${m}min`);
    }

    calcular();
    const id = setInterval(calcular, 60000);
    return () => clearInterval(id);
  }, [isoDate]);

  return tempo;
}

function CardAula({ aula, whatsapp }: { aula: AulaTrilha; whatsapp: string }) {
  const countdown = useCountdown(aula.status === 'aguardando_tempo' ? aula.liberada_em : null);
  const clicavel = aula.status === 'disponivel' || aula.status === 'concluida';
  const thumb = aula.youtube_video_id
    ? `https://img.youtube.com/vi/${aula.youtube_video_id}/mqdefault.jpg`
    : null;

  const badge = () => {
    if (aula.status === 'concluida') return (
      <span style={{ background: 'rgba(2,161,83,0.85)', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
        ✓ Concluída
      </span>
    );
    if (aula.status === 'disponivel') return (
      <span style={{ background: 'rgba(51,54,135,0.9)', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
        ▶ Disponível
      </span>
    );
    if (aula.status === 'aguardando_tempo') return (
      <span style={{ background: 'rgba(200,160,0,0.85)', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
        ⏰ {countdown || 'Aguardando'}
      </span>
    );
    return (
      <span style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--avp-text-dim)', fontSize: 11, padding: '3px 8px', borderRadius: 20 }}>
        🔒 Bloqueada
      </span>
    );
  };

  const card = (
    <div style={{
      flexShrink: 0, width: 220,
      background: 'var(--avp-card)',
      border: '1px solid var(--avp-border)',
      borderRadius: 10,
      overflow: 'hidden',
      cursor: clicavel ? 'pointer' : 'default',
      transition: 'transform 0.2s, border-color 0.2s',
      position: 'relative',
    }}
      onMouseEnter={e => { if (clicavel) { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--avp-blue-bright)'; } }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--avp-border)'; }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0d0f17', overflow: 'hidden' }}>
        {thumb && (
          <img src={thumb} alt={aula.aula_titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        {aula.status === 'bloqueada' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            🔒
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 6, left: 6 }}>
          {badge()}
        </div>
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 4px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {aula.aula_titulo}
        </p>
        {aula.duracao_minutos && (
          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0 }}>{aula.duracao_minutos} min</p>
        )}
      </div>
    </div>
  );

  if (clicavel) {
    return (
      <a href={`/aluno/${whatsapp}/aula/${aula.aula_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        {card}
      </a>
    );
  }
  return card;
}

export default function CarrosselModulos({ modulos, whatsapp }: { modulos: ModuloGroup[]; whatsapp: string }) {
  return (
    <div style={{ paddingBottom: 60 }}>
      {modulos.map(modulo => (
        <div key={modulo.modulo_id} style={{ marginBottom: 48 }}>
          <h2 style={{
            fontFamily: 'Inter',
            fontSize: 'clamp(20px, 3vw, 28px)',
            letterSpacing: 2,
            margin: '0 0 16px',
            padding: '0 5%',
          }}>
            {modulo.modulo_titulo}
          </h2>
          <div style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            paddingLeft: '5%',
            paddingRight: '5%',
            paddingBottom: 8,
            scrollbarWidth: 'thin',
          }}>
            {modulo.aulas.map(aula => (
              <CardAula key={aula.aula_id} aula={aula} whatsapp={whatsapp} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

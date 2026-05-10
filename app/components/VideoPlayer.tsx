'use client'

type Props = {
  youtubeId?: string | null
  videoUrl?: string | null
  titulo?: string
}

export default function VideoPlayer({ youtubeId, videoUrl, titulo }: Props) {
  const wrapper: React.CSSProperties = {
    position: 'relative', paddingBottom: '56.25%', height: 0,
    borderRadius: 12, overflow: 'hidden', background: '#000',
  }

  if (youtubeId) {
    return (
      <div style={wrapper}>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          title={titulo}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    )
  }

  if (videoUrl) {
    // Vimeo embed
    if (videoUrl.includes('vimeo.com')) {
      const vimeoId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1]
      if (vimeoId) {
        return (
          <div style={wrapper}>
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}?autoplay=0&title=0&byline=0&portrait=0`}
              title={titulo}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        )
      }
    }

    // MP4 / arquivo direto — player HTML5 nativo com todos os controles
    return (
      <div style={{ borderRadius: 12, overflow: 'hidden', background: '#000' }}>
        <video
          src={videoUrl}
          controls
          controlsList="nodownload"
          style={{ width: '100%', maxHeight: '70vh', display: 'block' }}
          playsInline
          preload="metadata"
        >
          Seu navegador não suporta reprodução de vídeo.
        </video>
      </div>
    )
  }

  return (
    <div style={{ ...wrapper, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--avp-card)', border: '1px solid var(--avp-border)' }}>
      <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, position: 'absolute' }}>Nenhum vídeo configurado.</p>
    </div>
  )
}

'use client'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    YT: { Player: new (el: HTMLElement, opts: object) => YTPlayer }
    onYouTubeIframeAPIReady?: () => void
  }
}

interface YTPlayer {
  destroy(): void
  getCurrentTime(): number
  seekTo(seconds: number, allowSeekAhead: boolean): void
}

type Props = {
  youtubeId?: string | null
  videoUrl?: string | null
  titulo?: string
  onEnded?: () => void
  bloquearAvancar?: boolean
}

export default function VideoPlayer({ youtubeId, videoUrl, titulo, onEnded, bloquearAvancar }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const maxWatchedRef = useRef(0)

  // ── YouTube IFrame API ──────────────────────────────────────────
  useEffect(() => {
    if (!youtubeId || !containerRef.current) return
    let destroyed = false

    function createPlayer() {
      if (!containerRef.current || destroyed) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: youtubeId!,
        width: '100%',
        height: '100%',
        playerVars: { rel: 0, modestbranding: 1, origin: window.location.origin },
        events: {
          onStateChange: (event: { data: number }) => {
            if (event.data === 0) onEnded?.()
            // Bloquear avanço: checa ao voltar a PLAYING (1) ou entrar em BUFFERING (3)
            if (bloquearAvancar && (event.data === 1 || event.data === 3) && playerRef.current) {
              const cur = playerRef.current.getCurrentTime()
              if (cur > maxWatchedRef.current + 1) {
                playerRef.current.seekTo(maxWatchedRef.current, true)
              }
            }
          },
          onReady: () => {
            if (!bloquearAvancar) return
            // Poll a cada 500ms para atualizar maxWatched com precisão
            const iv = setInterval(() => {
              if (!playerRef.current || destroyed) { clearInterval(iv); return }
              try {
                const cur = playerRef.current.getCurrentTime()
                if (cur > maxWatchedRef.current) maxWatchedRef.current = cur
              } catch { clearInterval(iv) }
            }, 500)
          },
        },
      })
    }

    if (window.YT?.Player) {
      createPlayer()
    } else {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { prev?.(); createPlayer() }
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement('script')
        s.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(s)
      }
    }

    return () => {
      destroyed = true
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [youtubeId])

  if (youtubeId) {
    return (
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden', background: '#000' }}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      </div>
    )
  }

  // ── Vimeo ───────────────────────────────────────────────────────
  if (videoUrl?.includes('vimeo.com')) {
    const vimeoId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1]
    if (vimeoId) {
      return (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden', background: '#000' }}>
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=0&title=0&byline=0&portrait=0`}
            title={titulo}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      )
    }
  }

  // ── MP4 / HTML5 ─────────────────────────────────────────────────
  if (videoUrl) {
    return (
      <Html5Player
        src={videoUrl}
        titulo={titulo}
        onEnded={onEnded}
        bloquearAvancar={bloquearAvancar}
      />
    )
  }

  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden', background: 'var(--avp-card)', border: '1px solid var(--avp-border)' }}>
      <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
        Nenhum vídeo configurado.
      </p>
    </div>
  )
}

// ── Player HTML5 com anti-skip ────────────────────────────────────
function Html5Player({ src, titulo, onEnded, bloquearAvancar }: {
  src: string; titulo?: string; onEnded?: () => void; bloquearAvancar?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const maxWatchedRef = useRef(0)

  function handleTimeUpdate() {
    if (!videoRef.current) return
    const cur = videoRef.current.currentTime
    if (bloquearAvancar) {
      if (cur > maxWatchedRef.current + 1.5) {
        videoRef.current.currentTime = maxWatchedRef.current
        return
      }
      if (cur > maxWatchedRef.current) maxWatchedRef.current = cur
    }
  }

  function handleSeeking() {
    if (!bloquearAvancar || !videoRef.current) return
    if (videoRef.current.currentTime > maxWatchedRef.current + 1.5) {
      videoRef.current.currentTime = maxWatchedRef.current
    }
  }

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: '#000' }}>
      <video
        ref={videoRef}
        src={src}
        controls
        controlsList={`nodownload${bloquearAvancar ? ' noplaybackrate' : ''}`}
        disablePictureInPicture={!!bloquearAvancar}
        style={{ width: '100%', maxHeight: '70vh', display: 'block' }}
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onEnded={onEnded}
        title={titulo}
      >
        Seu navegador não suporta reprodução de vídeo.
      </video>
    </div>
  )
}

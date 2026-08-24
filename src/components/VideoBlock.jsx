import { useCallback, useEffect, useRef, useState } from 'react'
import { VIDEO } from '../config/app.config'
import { track, trackOnce } from '../lib/tracking'

/**
 * ============================================================
 *  VIDEO BLOCK — VSL
 * ============================================================
 *
 * AUTOPLAY: navegador móvel bloqueia som sem gesto do usuário.
 * Não existe contorno. O padrão que funciona (e que VTurb e Panda
 * usam) é começar MUDO e pedir um toque para o áudio. É o que
 * está implementado aqui.
 *
 * PROGRESSO: quando o player é Cloudflare Stream, usamos o SDK
 * oficial para ler currentTime — tempo real de reprodução. Nos
 * demais casos cai para cronômetro, que infla se a pessoa pausar.
 *
 * Eventos: video_view · video_play · video_unmute
 *          video_25/50/75 · video_complete
 */

const SDK_SRC = 'https://embed.cloudflarestream.com/embed/sdk.latest.js'

function isCloudflare(url) {
  return /cloudflarestream\.com|videodelivery\.net/.test(url || '')
}

function buildSrc(url, { autoplay, muted }) {
  try {
    const u = new URL(url)
    const cf = isCloudflare(u.hostname)
    const yes = cf ? 'true' : '1'
    const no = cf ? 'false' : '0'

    if (autoplay) u.searchParams.set('autoplay', yes)
    if (muted) u.searchParams.set('muted', yes)
    if (VIDEO.hideControls) u.searchParams.set('controls', no)
    u.searchParams.set('preload', 'auto')
    return u.toString()
  } catch {
    return url
  }
}

function loadSdk() {
  return new Promise((resolve) => {
    if (window.Stream) return resolve(window.Stream)
    const existing = document.getElementById('cf-stream-sdk')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Stream))
      return
    }
    const s = document.createElement('script')
    s.id = 'cf-stream-sdk'
    s.src = SDK_SRC
    s.async = true
    s.onload = () => resolve(window.Stream)
    s.onerror = () => resolve(null)
    document.head.appendChild(s)
  })
}

export default function VideoBlock({ onProgress }) {
  const wrapRef = useRef(null)
  const iframeRef = useRef(null)
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const timerRef = useRef(null)

  const autoplayMode = Boolean(VIDEO.autoplay)
  const [started, setStarted] = useState(autoplayMode)
  const [muted, setMuted] = useState(autoplayMode)
  const [playing, setPlaying] = useState(false)

  const configured =
    (VIDEO.mode === 'embed' && VIDEO.embedUrl) ||
    (VIDEO.mode === 'mp4' && VIDEO.mp4Url) ||
    (VIDEO.mode === 'script' && VIDEO.scriptSrc)

  // ---------- video_view ----------
  useEffect(() => {
    const node = wrapRef.current
    if (!node) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackOnce('video_view', { mode: VIDEO.mode, autoplay: autoplayMode })
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [autoplayMode])

  // ---------- progresso ----------
  const reportProgress = useCallback(
    (seconds) => {
      const total = VIDEO.durationSeconds || 180
      const pct = Math.min(100, Math.round((seconds / total) * 100))
      if (pct >= 25) trackOnce('video_25', { seconds: Math.round(seconds) })
      if (pct >= 50) trackOnce('video_50', { seconds: Math.round(seconds) })
      if (pct >= 75) trackOnce('video_75', { seconds: Math.round(seconds) })
      if (pct >= 97) trackOnce('video_complete', { seconds: Math.round(seconds) })
      if (onProgress) onProgress(seconds)
    },
    [onProgress]
  )

  // ---------- SDK do Cloudflare: tempo real de reprodução ----------
  useEffect(() => {
    if (!started || VIDEO.mode !== 'embed' || !configured) return
    if (!isCloudflare(VIDEO.embedUrl)) return

    let cancelled = false
    let interval = null

    loadSdk().then((Stream) => {
      if (cancelled || !Stream || !iframeRef.current) {
        startFallbackTimer()
        return
      }
      try {
        const player = Stream(iframeRef.current)
        playerRef.current = player

        player.addEventListener('play', () => {
          setPlaying(true)
          trackOnce('video_play', { mode: 'embed', autoplay: autoplayMode })
        })
        player.addEventListener('ended', () => {
          trackOnce('video_complete', { seconds: VIDEO.durationSeconds })
        })

        interval = setInterval(() => {
          const t = player.currentTime
          if (typeof t === 'number' && !Number.isNaN(t)) reportProgress(t)
        }, 500)
      } catch {
        startFallbackTimer()
      }
    })

    function startFallbackTimer() {
      const t0 = Date.now()
      interval = setInterval(() => {
        reportProgress((Date.now() - t0) / 1000)
      }, 500)
    }

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [started, configured, autoplayMode, reportProgress])

  // ---------- players que não são Cloudflare ----------
  useEffect(() => {
    if (!started || VIDEO.mode === 'mp4') return
    if (VIDEO.mode === 'embed' && isCloudflare(VIDEO.embedUrl)) return
    const t0 = Date.now()
    timerRef.current = setInterval(() => reportProgress((Date.now() - t0) / 1000), 1000)
    return () => clearInterval(timerRef.current)
  }, [started, reportProgress])

  // ---------- script de terceiros (VTurb / Converteai) ----------
  useEffect(() => {
    if (!started || VIDEO.mode !== 'script' || !VIDEO.scriptSrc) return
    if (document.getElementById('vsl-script')) return
    const s = document.createElement('script')
    s.id = 'vsl-script'
    s.src = VIDEO.scriptSrc
    s.async = true
    document.body.appendChild(s)
  }, [started])

  useEffect(() => () => clearInterval(timerRef.current), [])

  // ---------- ações ----------
  function handlePlayFromCover() {
    if (started) return
    setStarted(true)
    setMuted(false)
    track('video_play', { mode: VIDEO.mode, autoplay: false })
  }

  function handleUnmute() {
    track('video_unmute', {})
    setMuted(false)

    // Cloudflare: desliga o mudo sem recarregar, preservando o tempo
    if (playerRef.current) {
      try {
        playerRef.current.muted = false
        playerRef.current.play()
        return
      } catch {
        /* cai para o reload abaixo */
      }
    }
    if (videoRef.current) {
      videoRef.current.muted = false
      videoRef.current.play()
    }
  }

  if (!VIDEO.enabled) return null

  const ratio = VIDEO.aspectRatio || '16 / 9'
  const [w, h] = ratio.split('/').map((n) => parseFloat(n))
  const isVertical = w && h ? w / h < 1 : false
  const showUnmute = started && muted && configured

  return (
    <div ref={wrapRef} style={{ marginTop: 26 }}>
      {VIDEO.headline && <h2 className="section-title">{VIDEO.headline}</h2>}
      {VIDEO.sublead && (
        <p className="body" style={{ marginTop: 12, marginBottom: 18 }}>
          {VIDEO.sublead}
        </p>
      )}

      <div className={`vsl ${isVertical ? 'vsl--vertical' : ''}`} style={{ aspectRatio: ratio }}>
        {/* capa (só quando autoplay está desligado) */}
        {!started && (
          <button className="vsl__cover" onClick={handlePlayFromCover} type="button" aria-label="Reproduzir vídeo">
            {VIDEO.posterUrl && (
              <img
                src={VIDEO.posterUrl}
                alt=""
                className="vsl__poster"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            <span className="vsl__play" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="vsl__hint">{configured ? 'Assistir' : 'Vídeo não configurado'}</span>
          </button>
        )}

        {started && VIDEO.mode === 'embed' && configured && (
          <iframe
            ref={iframeRef}
            className="vsl__frame"
            src={buildSrc(VIDEO.embedUrl, { autoplay: true, muted: autoplayMode })}
            title="Vídeo de apresentação"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
            allowFullScreen
          />
        )}

        {started && VIDEO.mode === 'mp4' && configured && (
          <video
            ref={videoRef}
            className="vsl__frame"
            src={VIDEO.mp4Url}
            poster={VIDEO.posterUrl || undefined}
            controls={!VIDEO.hideControls}
            autoPlay
            muted={autoplayMode}
            playsInline
            preload="auto"
            onPlay={() => setPlaying(true)}
            onTimeUpdate={(e) => reportProgress(e.target.currentTime)}
            onEnded={() => trackOnce('video_complete', { seconds: VIDEO.durationSeconds })}
          />
        )}

        {started && VIDEO.mode === 'script' && <div id={VIDEO.containerId} className="vsl__frame" />}

        {started && !configured && (
          <div className="vsl__frame vsl__empty">
            <p className="small" style={{ textAlign: 'center', padding: 24 }}>
              Preencha <code>VIDEO.embedUrl</code> em <code>src/config/app.config.js</code>.
            </p>
          </div>
        )}

        {/* camada de ativar som — cobre o vídeo inteiro */}
        {showUnmute && (
          <button className="vsl__unmute" onClick={handleUnmute} type="button">
            <span className="vsl__unmute-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
              </svg>
            </span>
            <span className="vsl__unmute-text">Seu vídeo já começou</span>
            <span className="vsl__unmute-sub">Toque para ativar o som</span>
          </button>
        )}
      </div>
    </div>
  )
}

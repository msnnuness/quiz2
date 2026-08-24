import { useEffect, useRef, useState } from 'react'
import { VIDEO } from '../config/app.config'
import { track, trackOnce } from '../lib/tracking'

/**
 * ============================================================
 *  VIDEO BLOCK — VSL pós-resultado
 * ============================================================
 *
 * Carrega com capa e só monta o player no clique. Isso importa:
 * iframe pesado na primeira renderização derruba o LCP da página
 * de resultado, que é onde a decisão de compra acontece.
 *
 * Eventos: video_view · video_play · video_25/50/75 · video_complete
 *
 * Só o modo 'mp4' rastreia progresso real. Nos modos 'embed' e
 * 'script' o progresso é estimado por cronômetro a partir do play —
 * se a pessoa pausar, o número infla. Trate como direcional.
 */
export default function VideoBlock({ onProgress }) {
  const wrapRef = useRef(null)
  const videoRef = useRef(null)
  const timerRef = useRef(null)
  const [started, setStarted] = useState(false)

  // video_view quando o bloco entra na tela
  useEffect(() => {
    const node = wrapRef.current
    if (!node) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackOnce('video_view', { mode: VIDEO.mode })
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  // injeta o script do player (VTurb / Converteai)
  useEffect(() => {
    if (!started || VIDEO.mode !== 'script' || !VIDEO.scriptSrc) return
    if (document.getElementById('vsl-script')) return
    const s = document.createElement('script')
    s.id = 'vsl-script'
    s.src = VIDEO.scriptSrc
    s.async = true
    document.body.appendChild(s)
  }, [started])

  function reportProgress(seconds) {
    const total = VIDEO.durationSeconds || 180
    const pct = Math.min(100, Math.round((seconds / total) * 100))
    if (pct >= 25) trackOnce('video_25', { seconds: Math.round(seconds) })
    if (pct >= 50) trackOnce('video_50', { seconds: Math.round(seconds) })
    if (pct >= 75) trackOnce('video_75', { seconds: Math.round(seconds) })
    if (pct >= 97) trackOnce('video_complete', { seconds: Math.round(seconds) })
    if (onProgress) onProgress(seconds)
  }

  function handlePlay() {
    if (started) return
    setStarted(true)
    track('video_play', { mode: VIDEO.mode })

    // mp4 tem progresso real; os outros usam cronômetro
    if (VIDEO.mode !== 'mp4') {
      const t0 = Date.now()
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - t0) / 1000
        reportProgress(elapsed)
        if (elapsed >= (VIDEO.durationSeconds || 180)) clearInterval(timerRef.current)
      }, 1000)
    }
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  if (!VIDEO.enabled) return null

  const configured =
    (VIDEO.mode === 'embed' && VIDEO.embedUrl) ||
    (VIDEO.mode === 'mp4' && VIDEO.mp4Url) ||
    (VIDEO.mode === 'script' && VIDEO.scriptSrc)

  const ratio = VIDEO.aspectRatio || '16 / 9'
  const [w, h] = ratio.split('/').map((n) => parseFloat(n))
  const isVertical = w && h ? w / h < 1 : false

  return (
    <div ref={wrapRef} style={{ marginTop: 30 }}>
      <h2 className="section-title">{VIDEO.headline}</h2>
      {VIDEO.sublead && (
        <p className="body" style={{ marginTop: 12, marginBottom: 20 }}>
          {VIDEO.sublead}
        </p>
      )}

      <div className={`vsl ${isVertical ? 'vsl--vertical' : ''}`} style={{ aspectRatio: ratio }}>
        {!started && (
          <button className="vsl__cover" onClick={handlePlay} type="button" aria-label="Reproduzir vídeo">
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
            <span className="vsl__hint">
              {configured ? `Assistir · ${formatDuration(VIDEO.durationSeconds)}` : 'Vídeo não configurado'}
            </span>
          </button>
        )}

        {started && VIDEO.mode === 'embed' && configured && (
          <iframe
            className="vsl__frame"
            src={withPlayerParams(VIDEO.embedUrl)}
            title="Vídeo de apresentação"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
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
            playsInline
            preload="metadata"
            onTimeUpdate={(e) => reportProgress(e.target.currentTime)}
            onEnded={() => trackOnce('video_complete', { seconds: VIDEO.durationSeconds })}
          />
        )}

        {started && VIDEO.mode === 'script' && <div id={VIDEO.containerId} className="vsl__frame" />}

        {started && !configured && (
          <div className="vsl__frame vsl__empty">
            <p className="small" style={{ textAlign: 'center', padding: 24 }}>
              Preencha <code>VIDEO.embedUrl</code> (ou <code>mp4Url</code> / <code>scriptSrc</code>) em{' '}
              <code>src/config/app.config.js</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Cada player usa um formato diferente de autoplay:
 * Cloudflare Stream e Panda esperam 'true', YouTube e Vimeo esperam '1'.
 */
function withPlayerParams(url) {
  try {
    const u = new URL(url)
    const host = u.hostname
    const isCloudflare = /cloudflarestream\.com|videodelivery\.net/.test(host)
    const usesBoolean = isCloudflare || /pandavideo\.com|b-cdn\.net|mediadelivery\.net/.test(host)
    u.searchParams.set('autoplay', usesBoolean ? 'true' : '1')

    if (VIDEO.hideControls) {
      if (isCloudflare) u.searchParams.set('controls', 'false')
      else u.searchParams.set('controls', '0')
    }
    return u.toString()
  } catch {
    return url
  }
}

function formatDuration(seconds) {
  const m = Math.floor((seconds || 0) / 60)
  const s = Math.round((seconds || 0) % 60)
  return s ? `${m}min${String(s).padStart(2, '0')}` : `${m} min`
}

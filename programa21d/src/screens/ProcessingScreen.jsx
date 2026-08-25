import { useEffect, useRef, useState } from 'react'
import { Check } from '../components/Icons'
import { TIMING } from '../config/app.config'

const STEPS = [
  'Analisando rotina e hábitos',
  'Analisando sono e recuperação',
  'Analisando disposição',
  'Analisando confiança',
  'Analisando impacto na rotina e relacionamentos',
  'Preparando suas prioridades',
]

const R = 48
const C = 2 * Math.PI * R

export default function ProcessingScreen({ onDone }) {
  const [pct, setPct] = useState(0)
  const [done, setDone] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    const total = TIMING.processing
    const start = performance.now()

    const tick = (now) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / total)
      // easing suave: acelera no meio, desacelera no fim
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      setPct(Math.round(eased * 100))
      setDone(Math.min(STEPS.length, Math.floor((elapsed / total) * (STEPS.length + 0.4)) + 1))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    const finish = setTimeout(onDone, total + 340)

    return () => {
      cancelAnimationFrame(raf.current)
      clearTimeout(finish)
    }
  }, [onDone])

  return (
    <div className="shell">
      <div className="stack">
        <div className="proc">
          <div className="proc__ring" aria-hidden="true">
            <svg width="108" height="108" viewBox="0 0 108 108">
              <circle cx="54" cy="54" r={R} stroke="#1a1f28" strokeWidth="3" />
              <circle
                cx="54"
                cy="54"
                r={R}
                stroke="var(--accent)"
                strokeWidth="3"
                strokeDasharray={C}
                strokeDashoffset={C - (C * pct) / 100}
                style={{ filter: 'drop-shadow(0 0 6px var(--accent-glow))' }}
              />
            </svg>
            <div className="proc__pct num">{pct}%</div>
          </div>

          <h2 className="section-title" style={{ textAlign: 'center' }} role="status" aria-live="polite">
            Analisando suas respostas...
          </h2>

          <div className="proc__list">
            {STEPS.map((label, i) => (
              <div key={label} className={`proc__item ${i < done ? 'proc__item--on' : ''}`}>
                <span className="proc__check" aria-hidden="true">
                  {i < done && <Check size={10} />}
                </span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

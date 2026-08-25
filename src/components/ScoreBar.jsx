import { useEffect, useState } from 'react'

/**
 * Barra de uma dimensão interna.
 * O número é um índice do programa, não uma medida clínica —
 * por isso o rótulo ao lado é qualitativo, não um score "de saúde".
 */
export default function ScoreBar({ label, score, tag, isPriority, index = 0 }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(score))
    return () => cancelAnimationFrame(id)
  }, [score])

  return (
    <div className="fade" style={{ '--i': index }}>
      <div className="bar__top">
        <span className="bar__label">{label}</span>
        <span className="bar__value num" aria-hidden="true">
          {score}/100
        </span>
      </div>

      <div className="bar__track">
        <div
          className={`bar__fill ${isPriority ? 'bar__fill--priority' : 'bar__fill--ok'}`}
          style={{ width: `${width}%`, '--i': index }}
        />
      </div>

      <div className={`bar__tag ${isPriority ? 'bar__tag--priority' : ''}`}>{tag}</div>
      <span className="sr-only">
        {label}: índice {score} de 100. {tag}.
      </span>
    </div>
  )
}

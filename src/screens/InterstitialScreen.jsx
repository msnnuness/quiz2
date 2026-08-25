import { useEffect } from 'react'
import { CheckThin, Lock } from '../components/Icons'
import { TIMING } from '../config/app.config'

/**
 * mode: 'auto' -> avança sozinha depois de TIMING.interstitial
 * mode: 'cta'  -> espera o clique
 */
export default function InterstitialScreen({ screen, onAdvance }) {
  const isAuto = screen.mode === 'auto'

  useEffect(() => {
    if (!isAuto) return
    const id = setTimeout(onAdvance, TIMING.interstitial)
    return () => clearTimeout(id)
  }, [isAuto, onAdvance, screen.id])

  return (
    <div className="shell">
      <div className="stack">
        <div className="inter">
          <div className="inter__mark fade" aria-hidden="true">
            {isAuto ? <CheckThin size={20} /> : <Lock size={18} />}
          </div>

          <h2 className="section-title rise" style={{ '--i': 1 }} role="status">
            {screen.title}
          </h2>

          {screen.body && (
            <p className="body rise" style={{ '--i': 2, marginTop: 14 }}>
              {screen.body}
            </p>
          )}

          {!isAuto && (
            <div className="rise" style={{ '--i': 3, marginTop: 36 }}>
              <button className="btn btn--primary" onClick={onAdvance} type="button" autoFocus>
                {screen.cta || 'Continuar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

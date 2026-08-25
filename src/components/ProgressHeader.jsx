import { ArrowLeft } from './Icons'

/**
 * "Sua avaliação • X% concluída" + barra + voltar discreto.
 */
export default function ProgressHeader({ progress, onBack, canGoBack = true }) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="topbar__row">
          {canGoBack ? (
            <button className="backbtn" onClick={onBack} aria-label="Voltar para a pergunta anterior" type="button">
              <ArrowLeft />
            </button>
          ) : (
            <span style={{ width: 23 }} aria-hidden="true" />
          )}
          <span className="topbar__label">
            Sua avaliação • <b className="num">{progress}%</b> concluída
          </span>
        </div>

        <div
          className="track"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da avaliação"
        >
          <div className="track__fill" style={{ width: `${Math.max(3, progress)}%` }} />
        </div>
      </div>
    </header>
  )
}

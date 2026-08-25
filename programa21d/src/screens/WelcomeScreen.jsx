import { Clock, Lock } from '../components/Icons'

export default function WelcomeScreen({ onStart }) {
  return (
    <div className="shell">
      <div className="stack hero">
        <div className="rise" style={{ '--i': 0 }}>
          <span className="hero__badge">
            <span className="dot" aria-hidden="true" />
            <span className="eyebrow">Avaliação de rotina</span>
          </span>
        </div>

        <h1 className="display rise" style={{ '--i': 1 }}>
          Entenda melhor sua performance
        </h1>

        <p className="body rise" style={{ '--i': 2, marginTop: 18 }}>
          Responda algumas perguntas sobre sua rotina, hábitos e bem-estar e descubra quais áreas merecem mais atenção.
        </p>

        <div className="hero__meta rise" style={{ '--i': 3 }}>
          <Clock />
          <span>Leva aproximadamente 2 minutos</span>
        </div>

        <div className="spacer" />

        <div className="rise" style={{ '--i': 4 }}>
          <button className="btn btn--primary" onClick={onStart} type="button">
            Começar minha avaliação
          </button>
          <div className="hero__foot">
            <Lock />
            <span>Privado e confidencial</span>
          </div>
        </div>
      </div>
    </div>
  )
}

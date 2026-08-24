import { useEffect, useRef, useState } from 'react'
import ScoreBar from '../components/ScoreBar'
import { CheckThin, Target, Calendar, Pulse, Chart, Book, Users, Spark } from '../components/Icons'
import VideoBlock from '../components/VideoBlock'
import { CHECKOUT_URL, PRICE, PRODUCT, VIDEO } from '../config/app.config'
import { track } from '../lib/tracking'
import { appendAttribution } from '../lib/attribution'
import { buildPayload } from '../lib/persistence'

const FEATURES = [
  { Icon: Target, title: 'Plano personalizado', text: 'As prioridades iniciais são organizadas de acordo com as respostas fornecidas no quiz.' },
  { Icon: Calendar, title: 'Jornada de 21 dias', text: 'Todos os dias o aplicativo apresenta pequenas ações para executar.' },
  { Icon: Pulse, title: 'Check-in diário', text: 'Você registra como foi seu dia e acompanha consistência.' },
  { Icon: Chart, title: 'Acompanhamento de progresso', text: 'Visualização dos dias concluídos, sequência e evolução.' },
  { Icon: Book, title: 'Conteúdo rápido', text: 'Explicações práticas e curtas relacionadas a hábitos e implementação.' },
  { Icon: Users, title: 'Comunidade privada', text: 'Espaço opcional e anônimo onde membros podem compartilhar experiências e evolução.' },
]

const INCLUDED = [
  'Plano personalizado',
  'Aplicativo',
  '21 dias de acompanhamento guiado',
  'Check-ins',
  'Progresso',
  'Comunidade privada',
]

export default function ResultScreen({ result, state }) {
  const offerRef = useRef(null)
  const [showSticky, setShowSticky] = useState(false)
  const [going, setGoing] = useState(false)

  // trava da oferta: só existe se revealOfferAfterSeconds > 0
  const gateSeconds = VIDEO.enabled ? VIDEO.revealOfferAfterSeconds || 0 : 0
  const [watched, setWatched] = useState(0)
  const offerLocked = gateSeconds > 0 && watched < gateSeconds
  const remaining = Math.max(0, Math.ceil(gateSeconds - watched))

  // offer_view quando a oferta entra na tela
  useEffect(() => {
    const node = offerRef.current
    if (!node) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          track('offer_view', { price: PRICE.amount, goal: result.goal })
          io.disconnect()
        }
      },
      { threshold: 0.25 }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [result.goal])

  // CTA fixo aparece depois da primeira dobra e some sobre a oferta
  useEffect(() => {
    const onScroll = () => {
      const past = window.scrollY > 460
      const node = offerRef.current
      const offerVisible = node ? node.getBoundingClientRect().top < window.innerHeight - 120 : false
      setShowSticky(past && !offerVisible && !offerLocked)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [offerLocked])

  function goToCheckout(source) {
    if (going) return
    setGoing(true)

    const payload = buildPayload(state)
    track('begin_checkout', {
      price: PRICE.amount,
      currency: PRICE.currency,
      goal: result.goal,
      priorities: result.priorities.map((p) => p.key).join('|'),
      cta_source: source,
    })

    // dá tempo para as tags dispararem antes do redirect
    setTimeout(() => {
      if (!CHECKOUT_URL || CHECKOUT_URL === 'COLOCAR_CHECKOUT_AQUI') {
        setGoing(false)
        console.warn('[21D] Defina CHECKOUT_URL em src/config/app.config.js', payload)
        alert('Checkout ainda não configurado.\n\nDefina CHECKOUT_URL em src/config/app.config.js')
        return
      }
      window.location.href = appendAttribution(CHECKOUT_URL)
    }, 260)
  }

  return (
    <>
      <div className="shell shell--wide">
        <div className="result">
          {/* ---------- RESULTADO ---------- */}
          <span className="eyebrow fade">Resultado</span>
          <h1 className="display rise" style={{ '--i': 1, marginTop: 12 }}>
            Sua análise está pronta
          </h1>
          <p className="body rise" style={{ '--i': 2, marginTop: 14 }}>
            {result.subhead}
          </p>

          <div className="bars" style={{ marginTop: 34 }}>
            {result.bars.map((bar, i) => (
              <ScoreBar
                key={bar.key}
                label={bar.label}
                score={bar.score}
                tag={bar.bandLabel}
                isPriority={bar.isPriority}
                index={i}
              />
            ))}
          </div>

          <p className="tiny" style={{ marginTop: 18 }}>
            Índice interno do programa, calculado a partir das suas respostas sobre hábitos e percepção pessoal. Não é
            medida clínica nem avaliação médica.
          </p>

          <hr className="rule" />

          {/* ---------- PRIORIDADES ---------- */}
          <h2 className="section-title">Suas 3 prioridades</h2>
          <p className="small" style={{ marginTop: 8, marginBottom: 22 }}>
            Com base nas respostas que você forneceu, é por aqui que faz mais sentido começar.
          </p>

          {result.priorities.map((p) => (
            <div className="prio" key={p.key}>
              <span className="prio__rank num" aria-hidden="true">
                {String(p.rank).padStart(2, '0')}
              </span>
              <div>
                <div className="prio__label">{p.label}</div>
                <p className="body" style={{ fontSize: 15 }}>
                  {p.text}
                </p>
              </div>
            </div>
          ))}

          <div className="goalbox" style={{ marginTop: 30 }}>
            <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>
              Seu objetivo declarado
            </span>
            <p style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.4 }}>{result.headline}</p>
          </div>

          <hr className="rule" />

          {/* ---------- PONTE ---------- */}
          <h2 className="section-title">Você não precisa tentar mudar tudo sozinho.</h2>
          <p className="body" style={{ marginTop: 14 }}>
            Informação sem aplicação costuma virar apenas mais uma coisa que sabemos que deveríamos fazer.
          </p>
          <p className="body" style={{ marginTop: 12 }}>
            Por isso, transformamos suas prioridades em uma jornada guiada de {PRODUCT.durationDays} dias.
          </p>

          {/* ---------- VÍDEO ---------- */}
          <VideoBlock onProgress={setWatched} />

          <hr className="rule" />

          {/* ---------- PRODUTO ---------- */}
          <span className="brandmark">
            <Spark size={14} />
            {PRODUCT.name}
          </span>
          <h2 className="section-title">
            {PRODUCT.durationDays} dias para construir uma rotina melhor, um dia de cada vez.
          </h2>
          <p className="body" style={{ marginTop: 14 }}>
            Receba um plano organizado de acordo com suas respostas e acompanhe sua evolução diariamente pelo aplicativo.
          </p>

          <div className="feats" style={{ marginTop: 26 }}>
            {FEATURES.map(({ Icon, title, text }) => (
              <div className="feat" key={title}>
                <span className="feat__icon">
                  <Icon />
                </span>
                <div className="feat__title">{title}</div>
                <p className="small">{text}</p>
              </div>
            ))}
          </div>

          <hr className="rule" />

          {/* ---------- COMUNIDADE ---------- */}
          <h2 className="section-title">Você não precisa passar por essa jornada sozinho.</h2>
          <p className="body" style={{ marginTop: 14, marginBottom: 20 }}>
            Dentro do programa existe uma comunidade privada onde os participantes podem utilizar apelidos e compartilhar
            pequenas vitórias, dificuldades, progresso, hábitos e motivação.
          </p>

          <div className="samplepost">
            <span className="samplepost__tag">Exemplo de publicação</span>
            <p className="small" style={{ color: '#d1d5db' }}>
              “Dia 6. Consegui manter o horário de dormir a semana inteira, coisa que eu não fazia há meses. Ainda acordo
              cansado, mas já é diferente.”
            </p>
            <p className="tiny" style={{ marginTop: 10 }}>
              Ilustração da interface. Não representa um usuário real.
            </p>
          </div>

          <hr className="rule" />

          {/* ---------- OFERTA ---------- */}
          {offerLocked && (
            <div className="gate" role="status" aria-live="polite">
              <span>
                As condições de acesso aparecem em <b className="num accent">{remaining}s</b> de vídeo.
              </span>
            </div>
          )}

          <div className="offer" ref={offerRef} hidden={offerLocked}>
            <span className="eyebrow">Acesso completo ao {PRODUCT.name}</span>

            <div className="price">
              {PRICE.compareAt && <span className="price__compare">{PRICE.compareAt}</span>}
              <span className="price__value">{PRICE.display}</span>
            </div>
            {PRICE.note && <p className="small">{PRICE.note}</p>}

            <ul className="checklist">
              {INCLUDED.map((item) => (
                <li key={item}>
                  <CheckThin size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button className="btn btn--primary" onClick={() => goToCheckout('offer')} disabled={going} type="button">
              {going ? 'Abrindo checkout...' : `Começar meus ${PRODUCT.durationDays} dias`}
            </button>
          </div>

          {/* ---------- AVISO ---------- */}
          <div className="disclaimer">
            <p className="tiny">
              Este programa tem caráter educacional e é voltado à organização de hábitos e bem-estar. Não realiza
              diagnóstico, prescrição ou tratamento médico. Sintomas persistentes ou preocupações de saúde devem ser
              avaliados por profissional habilitado.
            </p>
          </div>
        </div>
      </div>

      {/* ---------- CTA FIXO ---------- */}
      <div className={`stickybar ${showSticky ? 'stickybar--on' : ''}`} aria-hidden={!showSticky}>
        <div className="stickybar__inner">
          <button
            className="btn btn--primary"
            onClick={() => goToCheckout('sticky')}
            disabled={going}
            tabIndex={showSticky ? 0 : -1}
            type="button"
          >
            Começar meus {PRODUCT.durationDays} dias — {PRICE.display}
          </button>
        </div>
      </div>
    </>
  )
}

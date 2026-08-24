import { useEffect, useRef, useState } from 'react'
import ScoreBar from '../components/ScoreBar'
import VideoBlock from '../components/VideoBlock'
import { CheckThin, Target, Calendar, Pulse, Chart, Book, Users, Spark, Lock, Clock } from '../components/Icons'
import { CHECKOUT_URL, PRICE, PRODUCT, VIDEO, GUARANTEE, FAQ } from '../config/app.config'
import { track } from '../lib/tracking'
import { appendAttribution } from '../lib/attribution'
import { buildPayload } from '../lib/persistence'

/**
 * ============================================================
 *  RESULTADO + VSL + OFERTA
 * ============================================================
 * Ordem da página (é o que define a conversão):
 *   1. resultado      — entrega o que foi prometido no quiz
 *   2. prioridades    — personalização visível
 *   3. ponte + vídeo  — o pitch
 *   4. oferta         — logo depois do vídeo, sem rolagem longa
 *   5. garantia       — reduz risco percebido
 *   6. o que inclui   — detalhe de apoio, não abertura
 *   7. comunidade
 *   8. FAQ            — trata objeções que travam a compra
 *   9. CTA final
 */

const FEATURES = [
  { Icon: Target, title: 'Plano personalizado', text: 'As prioridades iniciais são organizadas de acordo com as respostas fornecidas no quiz.' },
  { Icon: Calendar, title: 'Jornada de 21 dias', text: 'Todos os dias o aplicativo apresenta pequenas ações para executar.' },
  { Icon: Pulse, title: 'Check-in diário', text: 'Você registra como foi seu dia e acompanha consistência.' },
  { Icon: Chart, title: 'Acompanhamento de progresso', text: 'Visualização dos dias concluídos, sequência e evolução.' },
  { Icon: Book, title: 'Conteúdo rápido', text: 'Explicações práticas e curtas relacionadas a hábitos e implementação.' },
  { Icon: Users, title: 'Comunidade privada', text: 'Espaço opcional e anônimo onde membros podem compartilhar experiências e evolução.' },
]

const INCLUDED = [
  'Plano personalizado a partir das suas respostas',
  'Acesso ao aplicativo',
  '21 dias de acompanhamento guiado',
  'Check-in diário e histórico',
  'Acompanhamento de progresso',
  'Comunidade privada e anônima',
]

export default function ResultScreen({ result, state }) {
  const offerRef = useRef(null)
  const [showSticky, setShowSticky] = useState(false)
  const [going, setGoing] = useState(false)

  const gateSeconds = VIDEO.enabled ? VIDEO.revealOfferAfterSeconds || 0 : 0
  const [watched, setWatched] = useState(0)
  const offerLocked = gateSeconds > 0 && watched < gateSeconds
  const remaining = Math.max(0, Math.ceil(gateSeconds - watched))

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

  useEffect(() => {
    const onScroll = () => {
      const past = window.scrollY > 500
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

  const ctaLabel = going ? 'Abrindo checkout...' : `Começar meus ${PRODUCT.durationDays} dias`
  const guaranteeTitle = (GUARANTEE.title || '').replace('{days}', GUARANTEE.days)

  return (
    <>
      <div className="shell shell--wide">
        <div className="result">
          {/* ---------- 1. RESULTADO ---------- */}
          <span className="eyebrow fade">Resultado</span>
          <h1 className="display rise" style={{ '--i': 1, marginTop: 12 }}>
            Sua análise está pronta
          </h1>
          <p className="body rise" style={{ '--i': 2, marginTop: 14 }}>
            {result.subhead}
          </p>

          <div className="bars" style={{ marginTop: 32 }}>
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

          <p className="tiny" style={{ marginTop: 16 }}>
            Índice interno do programa, calculado a partir das suas respostas sobre hábitos e percepção pessoal. Não é
            medida clínica nem avaliação médica.
          </p>

          <hr className="rule" />

          {/* ---------- 2. PRIORIDADES ---------- */}
          <h2 className="section-title">Suas 3 prioridades</h2>
          <p className="small" style={{ marginTop: 8, marginBottom: 18 }}>
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

          <div className="goalbox" style={{ marginTop: 26 }}>
            <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>
              Seu objetivo declarado
            </span>
            <p style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.4 }}>{result.headline}</p>
          </div>

          {/* ---------- 3. PONTE + VÍDEO ---------- */}
          <div className="vslzone">
            <h2 className="section-title" style={{ marginBottom: 12 }}>
              Você não precisa tentar mudar tudo sozinho.
            </h2>
            <p className="body">
              Informação sem aplicação costuma virar apenas mais uma coisa que sabemos que deveríamos fazer.
            </p>

            <VideoBlock onProgress={setWatched} />
          </div>

          {/* ---------- 4. OFERTA ---------- */}
          {offerLocked && (
            <div className="gate" role="status" aria-live="polite">
              <Clock size={16} />
              <span>
                As condições de acesso aparecem em <b className="num accent">{remaining}s</b>.
              </span>
            </div>
          )}

          <div className="offer offer--hero" ref={offerRef} hidden={offerLocked}>
            <span className="brandmark" style={{ marginBottom: 10 }}>
              <Spark size={14} />
              {PRODUCT.name}
            </span>

            <h2 className="section-title" style={{ marginBottom: 18 }}>
              {PRODUCT.durationDays} dias para construir uma rotina melhor, um dia de cada vez.
            </h2>

            <ul className="checklist">
              {INCLUDED.map((item) => (
                <li key={item}>
                  <CheckThin size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="pricebox">
              <span className="eyebrow">Acesso completo</span>
              <div className="price">
                {PRICE.compareAt && <span className="price__compare">{PRICE.compareAt}</span>}
                <span className="price__value">{PRICE.display}</span>
              </div>
              {PRICE.note && <p className="small">{PRICE.note}</p>}
            </div>

            <button className="btn btn--primary" onClick={() => goToCheckout('offer')} disabled={going} type="button">
              {ctaLabel}
            </button>

            <div className="offer__foot">
              <Lock size={12} />
              <span>Pagamento seguro · cobrança discreta na fatura</span>
            </div>
          </div>

          {/* ---------- 5. GARANTIA ---------- */}
          {GUARANTEE.enabled && !offerLocked && (
            <div className="guarantee">
              <div className="guarantee__badge num" aria-hidden="true">
                {GUARANTEE.days}
              </div>
              <div>
                <div className="feat__title" style={{ marginBottom: 4 }}>
                  {guaranteeTitle}
                </div>
                <p className="small">{GUARANTEE.text}</p>
              </div>
            </div>
          )}

          <hr className="rule" />

          {/* ---------- 6. O QUE ESTÁ INCLUÍDO ---------- */}
          <h2 className="section-title">O que está incluído</h2>
          <div className="feats" style={{ marginTop: 20 }}>
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

          {/* ---------- 7. COMUNIDADE ---------- */}
          <h2 className="section-title">Você não precisa passar por essa jornada sozinho.</h2>
          <p className="body" style={{ marginTop: 14, marginBottom: 18 }}>
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

          {/* ---------- 8. FAQ ---------- */}
          {FAQ.length > 0 && (
            <>
              <hr className="rule" />
              <h2 className="section-title" style={{ marginBottom: 16 }}>
                Perguntas frequentes
              </h2>
              <div className="faq">
                {FAQ.map((item) => (
                  <details className="faq__item" key={item.q}>
                    <summary className="faq__q">
                      <span>{item.q}</span>
                      <span className="faq__sign" aria-hidden="true" />
                    </summary>
                    <p className="small faq__a">{item.a}</p>
                  </details>
                ))}
              </div>
            </>
          )}

          {/* ---------- 9. CTA FINAL ---------- */}
          <div className="closer" hidden={offerLocked}>
            <p className="body" style={{ marginBottom: 18 }}>
              Suas prioridades já estão mapeadas. O próximo passo é começar.
            </p>
            <button className="btn btn--primary" onClick={() => goToCheckout('closer')} disabled={going} type="button">
              {ctaLabel}
            </button>
            <p className="small" style={{ marginTop: 12, textAlign: 'center' }}>
              {PRICE.display}
              {GUARANTEE.enabled ? ` · garantia de ${GUARANTEE.days} dias` : ''}
            </p>
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
            {ctaLabel} — {PRICE.display}
          </button>
        </div>
      </div>
    </>
  )
}

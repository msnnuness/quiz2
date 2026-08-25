import { GTM_ID, META_PIXEL_ID } from '../config/app.config'
import { getLeadData } from './attribution'

/**
 * ============================================================
 *  TRACKING
 * ============================================================
 *
 * PRIVACIDADE — regra que não deve ser afrouxada:
 * perguntas marcadas com `sensitive: true` em questions.js
 * (relacionamento, intimidade, confiança) NUNCA têm o valor
 * da resposta enviado ao dataLayer. Vai apenas o question_id
 * e o progresso, para você conseguir medir abandono por etapa
 * sem jogar dado íntimo dentro de plataforma de anúncio.
 *
 * As respostas completas ficam no localStorage e, no futuro,
 * no Supabase (banco seu, sob seu controle) — ver ./persistence.js.
 */

const REDACTED = '[sensitive]'

export function initDataLayer() {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
}

/** Injeta o GTM. Ignorado enquanto o ID for o placeholder. */
export function initGTM() {
  if (typeof window === 'undefined') return
  if (!GTM_ID || GTM_ID === 'GTM-XXXXXXX') return
  if (document.getElementById('gtm-script')) return

  initDataLayer()
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const script = document.createElement('script')
  script.id = 'gtm-script'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
  document.head.appendChild(script)

  const noscript = document.createElement('noscript')
  const iframe = document.createElement('iframe')
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`
  iframe.height = '0'
  iframe.width = '0'
  iframe.style.display = 'none'
  iframe.style.visibility = 'hidden'
  noscript.appendChild(iframe)
  document.body.prepend(noscript)
}

/**
 * ============================================================
 *  PIXEL DA META
 * ============================================================
 * Mapeamento dos eventos do funil para eventos da Meta:
 *
 *   quiz_start      -> QuizStart      (custom)
 *   quiz_50         -> QuizHalfway    (custom)
 *   quiz_complete   -> Lead           (padrão — use para otimizar)
 *   video_play      -> VideoPlay      (custom)
 *   content_reveal  -> ViewContent    (padrão)
 *   begin_checkout  -> InitiateCheckout (padrão, com valor)
 *
 * A Purchase NÃO sai daqui: o site nunca vê a compra acontecer.
 * Configure a Purchase no lado do Hubla (integração de Pixel
 * ou webhook + CAPI), senão você otimiza no evento errado.
 *
 * PRIVACIDADE: nenhum parâmetro carrega resposta de pergunta
 * sensível. Só marcos do funil.
 */
export function initMetaPixel() {
  if (typeof window === 'undefined') return
  if (!META_PIXEL_ID) return
  if (window.fbq) return

  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = !0
    n.version = '2.0'
    n.queue = []
    t = b.createElement(e)
    t.async = !0
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  /* eslint-enable */

  window.fbq('init', META_PIXEL_ID)
  window.fbq('track', 'PageView')
}

/** Eventos padrão da Meta (aparecem no Gerenciador sem configuração). */
const META_STANDARD = {
  quiz_complete: 'Lead',
  content_reveal: 'ViewContent',
  offer_view: 'ViewContent',
  begin_checkout: 'InitiateCheckout',
}

/** Eventos custom — precisam ser criados como conversão personalizada. */
const META_CUSTOM = {
  quiz_start: 'QuizStart',
  quiz_50: 'QuizHalfway',
  video_play: 'VideoPlay',
  video_unmute: 'VideoUnmute',
  video_50: 'VideoHalfway',
}

function sendToMeta(event, payload) {
  if (typeof window === 'undefined' || !window.fbq) return

  const standard = META_STANDARD[event]
  const custom = META_CUSTOM[event]
  if (!standard && !custom) return

  // só marcos do funil — nunca resposta de pergunta
  const params = {}
  if (event === 'begin_checkout' || event === 'offer_view') {
    params.value = payload.price
    params.currency = payload.currency || 'BRL'
    params.content_name = 'Programa 21D'
    params.content_type = 'product'
  }
  if (payload.goal) params.goal = payload.goal

  if (standard) window.fbq('track', standard, params)
  else window.fbq('trackCustom', custom, params)
}

/** Push genérico no dataLayer. */
export function track(event, payload = {}) {
  if (typeof window === 'undefined') return
  initDataLayer()
  const lead = getLeadData()
  const data = {
    event,
    session_id: lead.session_id,
    utm_source: lead.utm_source,
    utm_campaign: lead.utm_campaign,
    utm_content: lead.utm_content,
    src: lead.src,
    ...payload,
  }
  window.dataLayer.push(data)
  sendToMeta(event, payload)
  if (import.meta.env.DEV) console.debug('[dataLayer]', data)
}

const fired = new Set()

/** Dispara o evento só uma vez por sessão de página. */
export function trackOnce(event, payload = {}) {
  if (fired.has(event)) return
  fired.add(event)
  track(event, payload)
}

/**
 * Evento de resposta. `question` é o objeto vindo de questions.js.
 */
export function trackAnswer(question, answer, progress) {
  const isSensitive = Boolean(question.sensitive)
  track('quiz_answer', {
    question_id: question.id,
    question_index: question.index ?? null,
    answer: isSensitive ? REDACTED : Array.isArray(answer) ? answer.join('|') : answer,
    answer_is_sensitive: isSensitive,
    progress,
  })
}

/** Marcos de progresso: 25 / 50 / 75. */
export function trackMilestones(progress) {
  if (progress >= 25) trackOnce('quiz_25', { progress: 25 })
  if (progress >= 50) trackOnce('quiz_50', { progress: 50 })
  if (progress >= 75) trackOnce('quiz_75', { progress: 75 })
}

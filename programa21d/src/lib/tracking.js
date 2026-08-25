import { GTM_ID } from '../config/app.config'
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

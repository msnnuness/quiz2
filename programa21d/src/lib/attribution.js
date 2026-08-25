import { STORAGE, TRACKED_PARAMS } from '../config/app.config'

/**
 * ============================================================
 *  ATRIBUIÇÃO — UTMs, click ids e sessão
 * ============================================================
 * Captura na primeira visita (first-touch) e persiste.
 * Se o usuário voltar por outro anúncio, os parâmetros novos
 * substituem os antigos apenas se vierem preenchidos.
 */

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function readParams() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const out = {}
  for (const key of TRACKED_PARAMS) {
    const value = params.get(key)
    if (value) out[key] = value.slice(0, 300)
  }
  return out
}

function safeRead(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* modo privado / storage cheio — segue sem persistir */
  }
}

let cached = null

/**
 * @returns {{session_id, created_at, utm_source, utm_medium, utm_campaign,
 *            utm_content, utm_term, src, fbclid, landing_page, referrer}}
 */
export function getLeadData() {
  if (cached) return cached

  const existing = safeRead(STORAGE.lead)
  const fresh = readParams()

  const leadData = {
    session_id: existing?.session_id || uuid(),
    created_at: existing?.created_at || new Date().toISOString(),
    utm_source: fresh.utm_source || existing?.utm_source || null,
    utm_medium: fresh.utm_medium || existing?.utm_medium || null,
    utm_campaign: fresh.utm_campaign || existing?.utm_campaign || null,
    utm_content: fresh.utm_content || existing?.utm_content || null,
    utm_term: fresh.utm_term || existing?.utm_term || null,
    src: fresh.src || existing?.src || null,
    fbclid: fresh.fbclid || existing?.fbclid || null,
    gclid: fresh.gclid || existing?.gclid || null,
    ttclid: fresh.ttclid || existing?.ttclid || null,
    landing_page: existing?.landing_page || (typeof window !== 'undefined' ? window.location.pathname : null),
    referrer: existing?.referrer || (typeof document !== 'undefined' ? document.referrer || null : null),
  }

  safeWrite(STORAGE.lead, leadData)
  cached = leadData
  return leadData
}

/** Repassa os parâmetros de origem para a URL de checkout. */
export function appendAttribution(url) {
  const lead = getLeadData()
  try {
    const target = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://example.com')
    target.searchParams.set('sid', lead.session_id)
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src']) {
      if (lead[key]) target.searchParams.set(key, lead[key])
    }
    // fbclid como sck para atribuição cross-domain
    if (lead.fbclid) target.searchParams.set('sck', lead.fbclid)
    return target.toString()
  } catch {
    return url
  }
}

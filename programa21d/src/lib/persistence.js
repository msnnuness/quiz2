import { STORAGE } from '../config/app.config'
import { getLeadData } from './attribution'
import { QUESTION_BY_ID } from '../data/questions'

/**
 * ============================================================
 *  PERSISTÊNCIA
 * ============================================================
 * Hoje: localStorage.
 * Amanhã: Supabase — sem mexer em componente nenhum.
 *
 * Todo o app fala apenas com as funções deste arquivo.
 * Para plugar o Supabase, preencha os corpos das funções em
 * `remote` no final do arquivo e ligue REMOTE_ENABLED.
 *
 * Tabelas previstas (SQL sugerido no README):
 *   quiz_sessions, quiz_answers, quiz_results, customers,
 *   program_progress, daily_checkins, community_posts,
 *   community_comments
 */

const REMOTE_ENABLED = false

// ---------- LOCAL ----------

const emptyState = () => ({
  stage: 'welcome',
  index: 0,
  answers: {},
  startedAt: null,
  completedAt: null,
  result: null,
})

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE.session)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw)
    return { ...emptyState(), ...parsed }
  } catch {
    return emptyState()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE.session, JSON.stringify(state))
  } catch {
    /* storage indisponível — o quiz continua funcionando em memória */
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE.session)
  } catch {
    /* noop */
  }
}

// ---------- API PÚBLICA (usada pelos componentes) ----------

export async function persistSessionStart() {
  const lead = getLeadData()
  if (REMOTE_ENABLED) await remote.createSession(lead)
}

export async function persistAnswer(questionId, answer) {
  if (!REMOTE_ENABLED) return
  const lead = getLeadData()
  const question = QUESTION_BY_ID[questionId]
  await remote.saveAnswer({
    session_id: lead.session_id,
    question_id: questionId,
    answer,
    is_sensitive: Boolean(question?.sensitive),
  })
}

export async function persistResult(result) {
  if (!REMOTE_ENABLED) return
  const lead = getLeadData()
  await remote.saveResult({
    session_id: lead.session_id,
    scores: result.scores,
    priorities: result.priorities.map((p) => p.key),
    goal: result.goal,
  })
}

/** Payload completo — útil para enviar ao seu backend/checkout. */
export function buildPayload(state) {
  const lead = getLeadData()
  return {
    lead,
    answers: state.answers,
    scores: state.result?.scores || null,
    priorities: state.result?.priorities?.map((p) => p.key) || null,
    goal: state.answers.primary_goal || null,
    started_at: state.startedAt,
    completed_at: state.completedAt,
  }
}

// ---------- ADAPTADOR SUPABASE ----------
/*
  PARA ATIVAR:
    1. npm i @supabase/supabase-js
    2. rode supabase/schema.sql no SQL Editor
    3. crie o .env na raiz:
         VITE_SUPABASE_URL=https://xxxx.supabase.co
         VITE_SUPABASE_ANON_KEY=eyJ...
    4. descomente as duas linhas de import abaixo
    5. mude REMOTE_ENABLED (topo do arquivo) para true

  O schema não dá SELECT para a chave anon. O front só escreve.
  Para ler os dados, use a service_role no backend/n8n/Metabase —
  nunca no navegador.
*/

// import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

const supabase = null

/** Nunca deixa um erro de rede quebrar o quiz. */
async function safe(label, fn) {
  if (!supabase) return null
  try {
    const { error } = await fn()
    if (error) console.warn(`[21D] falha ao gravar ${label}:`, error.message)
    return null
  } catch (err) {
    console.warn(`[21D] falha ao gravar ${label}:`, err)
    return null
  }
}

const remote = {
  createSession(lead) {
    return safe('quiz_sessions', () =>
      supabase.from('quiz_sessions').upsert(
        {
          session_id: lead.session_id,
          created_at: lead.created_at,
          utm_source: lead.utm_source,
          utm_medium: lead.utm_medium,
          utm_campaign: lead.utm_campaign,
          utm_content: lead.utm_content,
          utm_term: lead.utm_term,
          src: lead.src,
          fbclid: lead.fbclid,
          gclid: lead.gclid,
          ttclid: lead.ttclid,
          landing_page: lead.landing_page,
          referrer: lead.referrer,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        },
        { onConflict: 'session_id' }
      )
    )
  },

  saveAnswer({ session_id, question_id, answer, is_sensitive }) {
    return safe('quiz_answers', () =>
      supabase.from('quiz_answers').upsert(
        { session_id, question_id, answer, is_sensitive: Boolean(is_sensitive) },
        { onConflict: 'session_id,question_id' }
      )
    )
  },

  async saveResult({ session_id, scores, priorities, goal }) {
    await safe('quiz_results', () =>
      supabase.from('quiz_results').upsert({ session_id, scores, priorities, goal }, { onConflict: 'session_id' })
    )
    return safe('completed_at', () =>
      supabase.from('quiz_sessions').update({ completed_at: new Date().toISOString() }).eq('session_id', session_id)
    )
  },
}

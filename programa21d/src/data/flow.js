import { QUESTIONS } from './questions'

/**
 * ============================================================
 *  FLUXO DE TELAS
 * ============================================================
 * Para reordenar o quiz ou mover uma transição de lugar,
 * basta reorganizar este array. A barra de progresso conta
 * apenas telas do tipo 'question'.
 */

const q = (id) => {
  const found = QUESTIONS.find((x) => x.id === id)
  if (!found) throw new Error(`Pergunta não encontrada em questions.js: ${id}`)
  return { type: 'question', question: found }
}

export const FLOW = [
  q('age_range'),
  q('primary_goal'),
  q('duration'),

  {
    type: 'interstitial',
    id: 'routine_bridge',
    mode: 'auto', // avança sozinha
    title: 'Entendido. Agora vamos analisar alguns fatores da sua rotina.',
  },

  q('sleep_hours'),
  q('morning_energy'),
  q('routine_factors'),

  {
    type: 'interstitial',
    id: 'personal_bridge',
    mode: 'cta', // espera o clique
    title: 'Agora algumas perguntas mais pessoais.',
    body: 'Suas respostas são privadas e ajudam a personalizar melhor sua experiência.',
    cta: 'CONTINUAR',
  },

  q('relationship_status'),
  q('avoidance'),
  q('confidence_impact'),
  q('relationship_impact'),
  q('self_perception'),
  q('commitment'),
]

export const TOTAL_QUESTIONS = FLOW.filter((s) => s.type === 'question').length

/** Quantas perguntas já foram exibidas até (e incluindo) o índice dado. */
export function questionsUpTo(index) {
  return FLOW.slice(0, index + 1).filter((s) => s.type === 'question').length
}

/** Progresso 0–100 baseado em perguntas respondidas. */
export function progressAt(index) {
  const answered = FLOW.slice(0, index).filter((s) => s.type === 'question').length
  return Math.round((answered / TOTAL_QUESTIONS) * 100)
}

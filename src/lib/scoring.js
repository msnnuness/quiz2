import { QUESTIONS, DIMENSIONS } from '../data/questions'

/**
 * ============================================================
 *  SCORING — quatro dimensões internas, 0 a 100
 * ============================================================
 *
 * ATENÇÃO CONCEITUAL
 * Este índice NÃO é diagnóstico, risco médico, medida hormonal
 * ou avaliação de função sexual. É um índice interno do programa,
 * derivado exclusivamente das respostas de hábitos e percepção
 * pessoal, usado apenas para ordenar prioridades do plano.
 *
 * COMO FUNCIONA
 * 1. Cada opção escolhida soma pontos às dimensões (questions.js).
 * 2. Perguntas 'multi' partem de `base` e sofrem descontos.
 * 3. O máximo teórico por dimensão é derivado automaticamente
 *    das perguntas — se você adicionar/remover perguntas, a
 *    normalização se ajusta sozinha.
 * 4. Normaliza para 0–100 e limita a FLOOR..CEIL para evitar
 *    barras alarmistas (zero absoluto) ou perfeitas.
 */

const FLOOR = 18
const CEIL = 94

const DIM_KEYS = Object.keys(DIMENSIONS)

/** Máximo teórico por dimensão, derivado do banco de perguntas. */
export function computeMaxima(questions = QUESTIONS) {
  const max = Object.fromEntries(DIM_KEYS.map((k) => [k, 0]))

  for (const q of questions) {
    if (q.type === 'multi') {
      for (const [dim, value] of Object.entries(q.base || {})) {
        max[dim] += value
      }
      continue
    }
    // single: a melhor opção possível por dimensão
    for (const dim of DIM_KEYS) {
      const best = Math.max(0, ...q.options.map((o) => (o.points && o.points[dim]) || 0))
      max[dim] += best
    }
  }
  return max
}

const MAXIMA = computeMaxima()

/** Pontos brutos ganhos com as respostas. */
function computeRaw(answers) {
  const raw = Object.fromEntries(DIM_KEYS.map((k) => [k, 0]))

  for (const q of QUESTIONS) {
    const answer = answers[q.id]
    if (answer === undefined || answer === null) continue

    if (q.type === 'multi') {
      const selected = Array.isArray(answer) ? answer : [answer]
      for (const [dim, base] of Object.entries(q.base || {})) {
        let value = base
        for (const value_ of selected) {
          const opt = q.options.find((o) => o.value === value_)
          if (opt?.points?.[dim]) value += opt.points[dim]
        }
        raw[dim] += Math.max(0, Math.min(base, value))
      }
      continue
    }

    const opt = q.options.find((o) => o.value === answer)
    if (!opt?.points) continue
    for (const [dim, value] of Object.entries(opt.points)) {
      raw[dim] += value
    }
  }
  return raw
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

/**
 * @returns {{energy:number, sleep:number, consistency:number, confidence:number}}
 */
export function computeScores(answers = {}) {
  const raw = computeRaw(answers)
  const out = {}
  for (const dim of DIM_KEYS) {
    const max = MAXIMA[dim] || 1
    const pct = (raw[dim] / max) * 100
    out[dim] = Math.round(clamp(pct, FLOOR, CEIL))
  }
  return out
}

/** Faixa qualitativa — usada só para escolher o texto exibido. */
export function band(score) {
  if (score >= 70) return 'strong'
  if (score >= 45) return 'moderate'
  return 'attention'
}

export { DIM_KEYS, MAXIMA }

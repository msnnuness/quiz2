import { DIMENSIONS } from '../data/questions'
import { computeScores, band, DIM_KEYS } from './scoring'

/**
 * ============================================================
 *  RESULTADO
 * ============================================================
 * Monta as 3 prioridades e a headline personalizada.
 *
 * REGRA DE LINGUAGEM (não quebrar):
 *  - sempre "Com base nas respostas que você forneceu..."
 *  - nunca "detectamos", "você tem", "seu nível de X está baixo"
 *  - nunca prometer melhora de função sexual
 */

/** Objetivo declarado -> dimensão que entra nas prioridades de qualquer forma. */
const GOAL_TO_DIMENSION = {
  ENERGY: 'energy',
  LIBIDO: 'confidence',
  PERFORMANCE: 'confidence',
  CONTROL: 'confidence',
  WELLBEING: null, // deixa o índice decidir
}

/** Headline exibida logo depois do resultado, conforme primary_goal. */
export const GOAL_HEADLINE = {
  ENERGY: 'Vamos trabalhar para construir uma rotina mais consistente de energia e disposição.',
  LIBIDO: 'Vamos trabalhar hábitos de bem-estar e rotina relacionados ao seu objetivo de recuperar disposição e confiança.',
  PERFORMANCE: 'Vamos construir uma rotina voltada para bem-estar, consistência e confiança.',
  CONTROL: 'Vamos trabalhar hábitos, bem-estar e confiança de forma estruturada durante os próximos 21 dias.',
  WELLBEING: 'Vamos organizar seus hábitos em uma rotina simples de acompanhar, um dia de cada vez.',
}

/**
 * Textos das prioridades. Cada dimensão tem variações escolhidas
 * pelas respostas específicas — é o que dá a sensação de
 * "isso foi montado com base no que eu respondi".
 */
const PRIORITY_COPY = {
  sleep: (a) => {
    if (['under_5', '5_6'].includes(a.sleep_hours)) {
      return 'Com base nas respostas que você forneceu, o tempo de sono aparece bem abaixo do que a maioria dos adultos precisa para recuperar. É o ponto com maior efeito sobre todo o resto da sua rotina.'
    }
    if (['never_rested', 'very_tired'].includes(a.morning_energy)) {
      return 'Você informou que costuma acordar cansado mesmo dormindo. Antes de aumentar as horas, vale trabalhar a qualidade e a regularidade do descanso.'
    }
    if (a.sleep_hours === '6_7') {
      return 'Seu sono está perto do suficiente, mas não sobra margem. Pequenos ajustes de horário tendem a render bastante aqui.'
    }
    return 'Sua rotina de descanso aparece como uma das áreas com maior oportunidade de melhoria.'
  },

  energy: (a) => {
    const f = a.routine_factors || []
    if (f.includes('low_activity') && f.includes('poor_diet')) {
      return 'Você marcou pouca atividade física e alimentação que poderia melhorar. São dois fatores que puxam disposição para baixo ao longo do dia — e os dois respondem rápido a mudanças pequenas.'
    }
    if (f.includes('long_hours') || f.includes('stress')) {
      return 'Carga de trabalho e estresse apareceram nas suas respostas. Sem pausas estruturadas, a energia costuma cair no meio do dia e não volta.'
    }
    if (a.self_perception === 'lost_drive') {
      return 'Você disse sentir que perdeu parte da disposição. O plano começa recuperando os pontos de rotina que mais influenciam esse ponto no dia a dia.'
    }
    return 'Sua disposição ao longo do dia aparece como uma área que merece atenção nas próximas semanas.'
  },

  consistency: (a) => {
    const f = a.routine_factors || []
    if (f.includes('no_routine')) {
      return 'Você indicou dificuldade em manter uma rotina. Por isso o plano começa com poucas ações por dia: constância pesa mais do que intensidade.'
    }
    if (a.commitment === 'maybe' || a.commitment === 'unsure') {
      return 'Como o tempo é curto, o plano prioriza ações curtas e encaixáveis em vez de mudanças grandes que costumam durar poucos dias.'
    }
    if (a.duration === 'over_year' || a.duration === 'unknown') {
      return 'Pelo tempo que você indicou, o caminho tende a ser de reconstrução gradual. Pequenas mudanças diárias são mais sustentáveis do que tentar mudar tudo de uma vez.'
    }
    return 'Pequenas mudanças feitas diariamente podem ser mais sustentáveis do que tentar mudar tudo de uma vez.'
  },

  confidence: (a) => {
    if (a.confidence_impact === 'top_priority' || a.confidence_impact === 'a_lot') {
      return 'Você indicou que essa é uma das coisas que mais quer mudar. O programa trata isso como tema central, com foco em rotina, bem-estar e segurança pessoal.'
    }
    if (a.avoidance === 'often' || a.avoidance === 'sometimes') {
      return 'Suas respostas indicam que a insegurança já vem influenciando escolhas do dia a dia. Recuperar consistência costuma ser o primeiro passo para reduzir esse peso.'
    }
    if (a.relationship_impact === 'hard_to_talk') {
      return 'Você mencionou dificuldade em conversar sobre o assunto. Parte do conteúdo é justamente sobre nomear e organizar isso, no seu tempo.'
    }
    return 'Suas respostas indicam que recuperar consistência e segurança pessoal é uma prioridade para você.'
  },
}

/**
 * Quando a dimensão já aparece forte (banda 'strong'), a prioridade
 * vira manutenção — nunca "merece atenção". Evita o resultado dizer
 * que algo está ruim quando as respostas indicaram o contrário.
 */
const MAINTAIN_COPY = {
  sleep: 'Seu descanso já aparece como um ponto forte. Aqui o objetivo é proteger o que funciona, porque é o primeiro hábito a cair quando a rotina aperta.',
  energy: 'Sua disposição já aparece bem. O plano foca em manter esse padrão nos dias de rotina cheia, que costumam ser os que derrubam a consistência.',
  consistency: 'Você já demonstra constância. A jornada serve para transformar isso em sistema, com registro diário e menos dependência de disposição.',
  confidence: 'Suas respostas não apontam esse ponto como um problema hoje. Ainda assim, é o objetivo que você escolheu — então ele entra no plano como manutenção e prevenção.',
}

/** Rótulo curto exibido ao lado da barra. */
export function bandLabel(score) {
  const b = band(score)
  if (b === 'strong') return 'Ponto forte'
  if (b === 'moderate') return 'Espaço para melhorar'
  return 'Merece atenção'
}

/**
 * @returns {{
 *   scores: object,
 *   bars: Array<{key,label,score,bandLabel}>,
 *   priorities: Array<{key,label,score,text,rank}>,
 *   headline: string,
 *   goal: string
 * }}
 */
export function buildResult(answers = {}) {
  const scores = computeScores(answers)
  const goal = answers.primary_goal || 'WELLBEING'

  // 1. ordena da menor pontuação para a maior (menor = mais prioritário)
  const ranked = [...DIM_KEYS].sort((a, b) => scores[a] - scores[b])
  let priorityKeys = ranked.slice(0, 3)

  // 2. garante que a dimensão ligada ao objetivo declarado apareça
  const goalDim = GOAL_TO_DIMENSION[goal]
  if (goalDim && !priorityKeys.includes(goalDim)) {
    priorityKeys = [...priorityKeys.slice(0, 2), goalDim]
  }

  // 3. dentro das prioridades, o objetivo declarado sobe para o topo
  if (goalDim && priorityKeys.includes(goalDim)) {
    priorityKeys = [goalDim, ...priorityKeys.filter((k) => k !== goalDim)]
  }

  const priorities = priorityKeys.map((key, i) => ({
    key,
    rank: i + 1,
    label: DIMENSIONS[key].label,
    score: scores[key],
    mode: band(scores[key]) === 'strong' ? 'maintain' : 'improve',
    text: band(scores[key]) === 'strong' ? MAINTAIN_COPY[key] : PRIORITY_COPY[key](answers),
  }))

  const bars = DIM_KEYS.map((key) => ({
    key,
    label: DIMENSIONS[key].label,
    score: scores[key],
    bandLabel: bandLabel(scores[key]),
    isPriority: priorityKeys.includes(key),
  }))

  const allStrong = priorities.every((p) => p.mode === 'maintain')

  return {
    scores,
    bars,
    priorities,
    goal,
    allStrong,
    subhead: allStrong
      ? 'Suas respostas indicam uma base já bem estruturada. Organizamos por onde vale começar para manter isso.'
      : 'Identificamos as áreas que mais merecem sua atenção neste momento.',
    headline: GOAL_HEADLINE[goal] || GOAL_HEADLINE.WELLBEING,
  }
}

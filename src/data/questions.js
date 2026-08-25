/**
 * ============================================================
 *  PERGUNTAS
 * ============================================================
 *
 * Cada pergunta:
 *   id          -> chave salva nas respostas (ex.: answers.sleep_hours)
 *   title       -> enunciado
 *   help        -> texto auxiliar opcional
 *   type        -> 'single' | 'multi'
 *   sensitive   -> true = a resposta NUNCA vai para plataformas de anúncio
 *   options[]   -> { value, label, points, exclusive? }
 *
 * points = pontos somados às dimensões internas.
 * Em perguntas 'multi', use `base` (pontos iniciais) e points negativos nas opções.
 *
 * Para trocar/adicionar perguntas: edite este arquivo e o array FLOW em ./flow.js.
 * O scoring se recalibra sozinho (o máximo por dimensão é derivado daqui).
 */

export const DIMENSIONS = {
  energy: { key: 'energy', label: 'Energia e rotina' },
  sleep: { key: 'sleep', label: 'Sono e recuperação' },
  consistency: { key: 'consistency', label: 'Consistência' },
  confidence: { key: 'confidence', label: 'Confiança e bem-estar' },
}

export const QUESTIONS = [
  {
    id: 'age_range',
    title: 'Qual é a sua idade?',
    type: 'single',
    options: [
      { value: '18_24', label: '18–24' },
      { value: '25_29', label: '25–29' },
      { value: '30_35', label: '30–35' },
      { value: '36_45', label: '36–45' },
      { value: '46_55', label: '46–55' },
      { value: '56_plus', label: '56 ou mais' },
    ],
  },

  {
    id: 'primary_goal',
    title: 'O que você mais gostaria de melhorar hoje?',
    type: 'single',
    options: [
      { value: 'ENERGY', label: 'Minha disposição e energia' },
      { value: 'LIBIDO', label: 'Minha libido' },
      { value: 'PERFORMANCE', label: 'Minha confiança no desempenho' },
      { value: 'CONTROL', label: 'Meu controle durante a relação' },
      { value: 'WELLBEING', label: 'Meu bem-estar de forma geral' },
    ],
  },

  {
    id: 'duration',
    title: 'Há quanto tempo você percebe que não está no seu melhor?',
    type: 'single',
    options: [
      { value: 'recent', label: 'Começou recentemente', points: { confidence: 8, consistency: 5 } },
      { value: 'months', label: 'Alguns meses', points: { confidence: 6, consistency: 4 } },
      { value: '6_12', label: 'Entre 6 meses e 1 ano', points: { confidence: 4, consistency: 3 } },
      { value: 'over_year', label: 'Mais de 1 ano', points: { confidence: 2, consistency: 1 } },
      { value: 'unknown', label: 'Nem sei dizer quando começou', points: { confidence: 3, consistency: 1 } },
    ],
  },

  {
    id: 'sleep_hours',
    title: 'Quantas horas você costuma dormir por noite?',
    type: 'single',
    options: [
      { value: '8_plus', label: '8 horas ou mais', points: { sleep: 30 } },
      { value: '7_8', label: 'Entre 7 e 8 horas', points: { sleep: 26 } },
      { value: '6_7', label: 'Entre 6 e 7 horas', points: { sleep: 17 } },
      { value: '5_6', label: 'Entre 5 e 6 horas', points: { sleep: 9 } },
      { value: 'under_5', label: 'Menos de 5 horas', points: { sleep: 3 } },
    ],
  },

  {
    id: 'morning_energy',
    title: 'Como você costuma acordar na maioria dos dias?',
    type: 'single',
    options: [
      { value: 'rested', label: 'Descansado e disposto', points: { sleep: 20, energy: 25 } },
      { value: 'ok', label: 'Razoavelmente bem', points: { sleep: 16, energy: 20 } },
      { value: 'tired', label: 'Cansado', points: { sleep: 9, energy: 12 } },
      { value: 'very_tired', label: 'Muito cansado', points: { sleep: 5, energy: 6 } },
      { value: 'never_rested', label: 'Parece que nunca descanso o suficiente', points: { sleep: 2, energy: 3 } },
    ],
  },

  {
    id: 'routine_factors',
    title: 'Como está sua rotina atualmente?',
    help: 'Escolha quantas quiser.',
    type: 'multi',
    base: { energy: 25, consistency: 25 },
    options: [
      { value: 'long_hours', label: 'Trabalho muitas horas', points: { energy: -7, consistency: -5 } },
      { value: 'stress', label: 'Tenho bastante estresse', points: { energy: -7, consistency: -4 } },
      { value: 'low_activity', label: 'Pratico pouca atividade física', points: { energy: -8, consistency: -6 } },
      { value: 'poor_diet', label: 'Minha alimentação poderia melhorar', points: { energy: -6, consistency: -6 } },
      { value: 'no_routine', label: 'Tenho dificuldade para manter uma rotina', points: { energy: -4, consistency: -12 } },
      { value: 'balanced', label: 'Considero minha rotina equilibrada', points: {}, exclusive: true },
    ],
  },

  {
    id: 'relationship_status',
    title: 'Qual é a sua situação de relacionamento atualmente?',
    type: 'single',
    sensitive: true,
    options: [
      { value: 'married', label: 'Casado' },
      { value: 'relationship', label: 'Em um relacionamento' },
      { value: 'dating', label: 'Conhecendo alguém' },
      { value: 'single', label: 'Solteiro' },
      { value: 'no_answer', label: 'Prefiro não responder' },
    ],
  },

  {
    id: 'avoidance',
    title: 'Você já evitou um momento íntimo por insegurança ou receio de não corresponder como gostaria?',
    type: 'single',
    sensitive: true,
    options: [
      { value: 'never', label: 'Nunca', points: { confidence: 25 } },
      { value: 'once', label: 'Já aconteceu uma vez', points: { confidence: 18 } },
      { value: 'sometimes', label: 'Algumas vezes', points: { confidence: 11 } },
      { value: 'often', label: 'Acontece com frequência', points: { confidence: 4 } },
      { value: 'no_answer', label: 'Prefiro não responder', points: { confidence: 13 } },
    ],
  },

  {
    id: 'confidence_impact',
    title: 'Quanto essa situação afeta sua confiança atualmente?',
    type: 'single',
    sensitive: true,
    options: [
      { value: 'none', label: 'Não afeta', points: { confidence: 25 } },
      { value: 'little', label: 'Afeta um pouco', points: { confidence: 18 } },
      { value: 'quite', label: 'Afeta bastante', points: { confidence: 11 } },
      { value: 'a_lot', label: 'Afeta muito', points: { confidence: 5 } },
      { value: 'top_priority', label: 'É uma das coisas que mais quero mudar', points: { confidence: 3 } },
    ],
  },

  {
    id: 'relationship_impact',
    title: 'Você sente que isso já afetou a forma como se relaciona com alguém?',
    type: 'single',
    sensitive: true,
    options: [
      { value: 'none', label: 'Não percebi impacto', points: { confidence: 15 } },
      { value: 'insecure', label: 'Fiquei mais inseguro', points: { confidence: 8 } },
      { value: 'no_initiative', label: 'Passei a evitar tomar iniciativa', points: { confidence: 6 } },
      { value: 'hard_to_talk', label: 'Tenho dificuldade de conversar sobre isso', points: { confidence: 7 } },
      { value: 'partner_noticed', label: 'A outra pessoa já percebeu uma mudança', points: { confidence: 5 } },
      { value: 'no_answer', label: 'Prefiro não responder', points: { confidence: 9 } },
    ],
  },

  {
    id: 'self_perception',
    title: 'Quando compara como se sente hoje com alguns anos atrás, qual frase mais representa você?',
    type: 'single',
    sensitive: true,
    options: [
      { value: 'still_good', label: 'Continuo me sentindo muito bem', points: { energy: 20, confidence: 15, consistency: 10 } },
      { value: 'some_changes', label: 'Percebo algumas mudanças', points: { energy: 15, confidence: 11, consistency: 8 } },
      { value: 'lost_drive', label: 'Sinto que perdi parte da minha disposição', points: { energy: 8, confidence: 8, consistency: 5 } },
      { value: 'less_confident', label: 'Minha confiança já foi maior', points: { energy: 11, confidence: 5, consistency: 5 } },
      { value: 'want_back', label: 'Quero voltar a cuidar melhor de mim', points: { energy: 9, confidence: 9, consistency: 4 } },
    ],
  },

  {
    id: 'commitment',
    title: 'Se você recebesse um plano simples mostrando o que fazer todos os dias durante 21 dias, qual seria seu nível de comprometimento?',
    type: 'single',
    options: [
      { value: 'now', label: 'Quero começar agora', points: { consistency: 20 } },
      { value: 'willing', label: 'Estou disposto a seguir', points: { consistency: 16 } },
      { value: 'maybe', label: 'Tentaria encaixar na rotina', points: { consistency: 9 } },
      { value: 'unsure', label: 'Ainda não tenho certeza', points: { consistency: 5 } },
    ],
  },
]

export const QUESTION_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]))

export function getOption(questionId, value) {
  const q = QUESTION_BY_ID[questionId]
  if (!q) return null
  return q.options.find((o) => o.value === value) || null
}

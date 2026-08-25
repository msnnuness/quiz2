import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FLOW, TOTAL_QUESTIONS, progressAt, questionsUpTo } from '../data/flow'
import { buildResult } from '../lib/results'
import { loadState, saveState, clearState, persistAnswer, persistResult, persistSessionStart } from '../lib/persistence'
import { track, trackOnce, trackAnswer, trackMilestones } from '../lib/tracking'
import { TIMING } from '../config/app.config'

/**
 * Máquina de estados do funil:
 *   welcome -> flow -> processing -> result
 */
export function useQuiz() {
  const [state, setState] = useState(() => loadState())
  const [locked, setLocked] = useState(false)
  const [direction, setDirection] = useState('forward')
  const timers = useRef([])

  // limpa timers pendentes ao desmontar
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const later = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }, [])

  // persiste em toda mudança
  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    trackOnce('quiz_view', { stage: state.stage })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const screen = FLOW[state.index] || null
  const progress = progressAt(state.index)
  const questionNumber = screen?.type === 'question' ? questionsUpTo(state.index) : questionsUpTo(state.index)

  const start = useCallback(() => {
    track('quiz_start', {})
    persistSessionStart()
    setDirection('forward')
    setState((s) => ({ ...s, stage: 'flow', index: 0, startedAt: s.startedAt || new Date().toISOString() }))
  }, [])

  const goToProcessing = useCallback(() => {
    setState((s) => {
      const result = buildResult(s.answers)
      const next = { ...s, stage: 'processing', result, completedAt: new Date().toISOString() }
      track('quiz_complete', { progress: 100, goal: s.answers.primary_goal || null })
      persistResult(result, s.answers)
      return next
    })
  }, [])

  const advance = useCallback(() => {
    setDirection('forward')
    setState((s) => {
      const nextIndex = s.index + 1
      if (nextIndex >= FLOW.length) return s // tratado por goToProcessing
      return { ...s, index: nextIndex }
    })
  }, [])

  /** Grava a resposta e avança (com trava anti duplo clique). */
  const answer = useCallback(
    (question, value, { autoAdvance = true } = {}) => {
      if (locked) return
      const isLast = state.index === FLOW.length - 1

      setState((s) => ({ ...s, answers: { ...s.answers, [question.id]: value } }))
      persistAnswer(question.id, value)

      const nextProgress = Math.round((questionsUpTo(state.index) / TOTAL_QUESTIONS) * 100)
      trackAnswer(question, value, nextProgress)
      trackMilestones(nextProgress)

      if (!autoAdvance) return

      setLocked(true)
      later(() => {
        setLocked(false)
        if (isLast) goToProcessing()
        else advance()
      }, TIMING.answerLock)
    },
    [locked, state.index, advance, goToProcessing, later]
  )

  /** Para múltipla escolha: só grava, sem avançar. */
  const setAnswer = useCallback((questionId, value) => {
    setState((s) => ({ ...s, answers: { ...s.answers, [questionId]: value } }))
  }, [])

  const back = useCallback(() => {
    if (locked) return
    setDirection('back')
    setState((s) => {
      if (s.stage === 'flow' && s.index === 0) return { ...s, stage: 'welcome' }
      if (s.stage !== 'flow') return s
      // pula transições automáticas ao voltar
      let i = s.index - 1
      while (i > 0 && FLOW[i].type === 'interstitial' && FLOW[i].mode === 'auto') i -= 1
      return { ...s, index: Math.max(0, i) }
    })
  }, [locked])

  const finishProcessing = useCallback(() => {
    setState((s) => ({ ...s, stage: 'result' }))
    track('result_view', {})
  }, [])

  const restart = useCallback(() => {
    clearState()
    setState(loadState())
  }, [])

  const result = useMemo(() => state.result || (state.stage === 'result' ? buildResult(state.answers) : null), [state])

  return {
    state,
    screen,
    progress,
    questionNumber,
    totalQuestions: TOTAL_QUESTIONS,
    locked,
    direction,
    result,
    answers: state.answers,
    start,
    answer,
    setAnswer,
    advance,
    back,
    goToProcessing,
    finishProcessing,
    restart,
    isLastScreen: state.index === FLOW.length - 1,
  }
}

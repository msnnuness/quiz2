import { useEffect } from 'react'
import { useQuiz } from './hooks/useQuiz'
import ProgressHeader from './components/ProgressHeader'
import WelcomeScreen from './screens/WelcomeScreen'
import QuestionScreen from './screens/QuestionScreen'
import InterstitialScreen from './screens/InterstitialScreen'
import ProcessingScreen from './screens/ProcessingScreen'
import ResultScreen from './screens/ResultScreen'

export default function App() {
  const quiz = useQuiz()
  const { state, screen } = quiz

  // volta ao topo a cada troca de tela
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [state.stage, state.index])

  // navegação por teclado: Backspace volta uma pergunta
  useEffect(() => {
    const onKey = (e) => {
      if (state.stage !== 'flow') return
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Backspace') {
        e.preventDefault()
        quiz.back()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.stage, quiz])

  const showHeader = state.stage === 'flow'

  return (
    <div className="app">
      {showHeader && (
        <ProgressHeader progress={quiz.progress} onBack={quiz.back} canGoBack={true} />
      )}

      {state.stage === 'welcome' && <WelcomeScreen onStart={quiz.start} />}

      {state.stage === 'flow' && screen?.type === 'question' && (
        <QuestionScreen
          key={screen.question.id}
          question={screen.question}
          value={state.answers[screen.question.id]}
          questionNumber={quiz.questionNumber}
          total={quiz.totalQuestions}
          locked={quiz.locked}
          direction={quiz.direction}
          isLast={quiz.isLastScreen}
          onAnswer={quiz.answer}
          onSetAnswer={quiz.setAnswer}
          onAdvance={quiz.advance}
        />
      )}

      {state.stage === 'flow' && screen?.type === 'interstitial' && (
        <InterstitialScreen key={screen.id} screen={screen} onAdvance={quiz.advance} />
      )}

      {state.stage === 'processing' && <ProcessingScreen onDone={quiz.finishProcessing} />}

      {state.stage === 'result' && quiz.result && <ResultScreen result={quiz.result} state={state} />}
    </div>
  )
}

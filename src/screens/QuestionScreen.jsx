import { useEffect, useState } from 'react'
import OptionCard from '../components/OptionCard'

/**
 * Uma pergunta por tela.
 *
 * single -> clicou, anima, avança sozinho
 * multi  -> acumula seleções e libera o botão "Continuar"
 *           (opções com `exclusive: true` limpam as demais)
 */
export default function QuestionScreen({ question, value, questionNumber, total, locked, onAnswer, onSetAnswer, onAdvance, isLast, direction }) {
  const isMulti = question.type === 'multi'
  const [selection, setSelection] = useState(() => (Array.isArray(value) ? value : value ? [value] : []))

  // reseta ao trocar de pergunta (ou ao voltar para uma já respondida)
  useEffect(() => {
    setSelection(Array.isArray(value) ? value : value ? [value] : [])
  }, [question.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSingle(optionValue) {
    if (locked) return
    setSelection([optionValue])
    onAnswer(question, optionValue)
  }

  function handleMulti(option) {
    const isOn = selection.includes(option.value)
    let next

    if (option.exclusive) {
      next = isOn ? [] : [option.value]
    } else {
      const exclusives = question.options.filter((o) => o.exclusive).map((o) => o.value)
      const cleaned = selection.filter((v) => !exclusives.includes(v))
      next = isOn ? cleaned.filter((v) => v !== option.value) : [...cleaned, option.value]
    }

    setSelection(next)
    onSetAnswer(question.id, next)
  }

  function submitMulti() {
    if (locked || selection.length === 0) return
    onAnswer(question, selection)
  }

  const animBase = `${question.id}-${direction}`

  return (
    <div className="shell">
      <div className="stack" style={{ paddingTop: 12 }}>
        <div className="rise" style={{ '--i': 0 }} key={`${animBase}-head`}>
          <span className="eyebrow">
            Pergunta {questionNumber} de {total}
          </span>
          <h2 className="q-title" style={{ marginTop: 12 }} id={`q-${question.id}`}>
            {question.title}
          </h2>
          {question.help && (
            <p className="small" style={{ marginTop: 9 }}>
              {question.help}
            </p>
          )}
        </div>

        <div
          className="options"
          style={{ marginTop: 26 }}
          role={isMulti ? 'group' : 'radiogroup'}
          aria-labelledby={`q-${question.id}`}
        >
          {question.options.map((option, i) => (
            <OptionCard
              key={option.value}
              animKey={`${animBase}-${option.value}`}
              label={option.label}
              multi={isMulti}
              index={i + 1}
              disabled={locked}
              selected={selection.includes(option.value)}
              onSelect={() => (isMulti ? handleMulti(option) : handleSingle(option.value))}
            />
          ))}
        </div>

        {isMulti && (
          <>
            <div className="spacer" />
            <button
              className="btn btn--primary"
              style={{ marginTop: 22 }}
              disabled={selection.length === 0 || locked}
              onClick={submitMulti}
              type="button"
            >
              {isLast ? 'Ver minha análise' : 'Continuar'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

import { Check } from './Icons'

/**
 * Card grande de resposta.
 * Acessibilidade: usa role radio/checkbox, aria-checked, e o estado
 * selecionado é indicado por marca + borda, nunca só por cor.
 */
export default function OptionCard({ label, selected, onSelect, multi = false, index = 0, disabled = false, animKey }) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      key={animKey}
      className={`opt rise ${selected ? 'opt--on' : ''} ${multi ? 'opt--square' : ''}`}
      style={{ '--i': index }}
    >
      <span className="opt__mark" aria-hidden="true">
        <Check />
      </span>
      <span className="opt__text">{label}</span>
    </button>
  )
}

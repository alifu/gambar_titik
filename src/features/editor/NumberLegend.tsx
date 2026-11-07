import { useId } from 'react'
import { ID } from '../../i18n/id'
import type { PaletteEntry } from '../../types/artwork'

type Props = {
  palette: readonly PaletteEntry[]
  /** Sisa kotak per entri palet. */
  remaining: readonly number[]
  selected: number
  onSelect: (index: number) => void
}

/** Legenda mode nomor: swatch + kode + nama + sisa kotak; warna tuntas diberi ✓ dan redup. */
export function NumberLegend({ palette, remaining, selected, onSelect }: Props) {
  const titleId = useId()
  const hintId = useId()
  return (
    <section className="number-legend" aria-labelledby={titleId} aria-describedby={hintId}>
      <h2 id={titleId} className="palette-title">
        {ID.numberMode.legend}
      </h2>
      <p id={hintId} className="number-legend-hint">
        {ID.numberMode.legendHint}
      </p>
      <ul className="number-legend-list">
        {palette.map((entry, index) => {
          const left = remaining[index] ?? 0
          const isDone = left === 0
          return (
            <li key={entry.code}>
              <button
                type="button"
                className={`number-legend-item${isDone ? ' number-legend-item--done' : ''}`}
                aria-pressed={index === selected}
                aria-label={ID.numberMode.entryLabel(entry.code, entry.name, left)}
                onClick={() => onSelect(index)}
              >
                <span
                  className="number-legend-swatch"
                  style={{ backgroundColor: entry.hex }}
                  aria-hidden="true"
                />
                <span className="number-legend-code" aria-hidden="true">
                  {entry.code}
                </span>
                <span className="number-legend-name" aria-hidden="true">
                  {entry.name}
                </span>
                <span className="number-legend-count" aria-hidden="true">
                  {isDone ? ID.numberMode.doneMark : left}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

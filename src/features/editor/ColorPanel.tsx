import { useId, useState, type FormEvent } from 'react'
import { normalizeHex } from '../../editor/color'
import { ID } from '../../i18n/id'

type Props = {
  color: string
  palette: readonly string[]
  recent: readonly string[]
  onColorChange: (color: string) => void
}

export function ColorPanel({ color, palette, recent, onColorChange }: Props) {
  const pickerId = useId()
  const handlePicker = (value: string) => {
    const hex = normalizeHex(value)
    if (hex) onColorChange(hex)
  }
  return (
    <section className="palette" aria-label={ID.editor.colors}>
      <div className="palette-current">
        <label htmlFor={pickerId} className="palette-picker-label">
          {ID.editor.colorPicker}
        </label>
        <input
          id={pickerId}
          className="palette-picker"
          type="color"
          value={color}
          onChange={(e) => handlePicker(e.target.value)}
        />
        <span className="palette-current-text">{ID.editor.currentColor(color)}</span>
      </div>
      <HexField key={color} color={color} onColorChange={onColorChange} />
      <SwatchList
        title={ID.editor.suggested}
        colors={palette}
        active={color}
        onPick={onColorChange}
      />
      <SwatchList
        title={ID.editor.recent}
        colors={recent}
        active={color}
        emptyText={ID.editor.noRecent}
        onPick={onColorChange}
      />
    </section>
  )
}

type HexFieldProps = {
  color: string
  onColorChange: (color: string) => void
}

/** Field HEX; di-reset (lewat `key`) setiap warna aktif berubah dari luar. */
function HexField({ color, onColorChange }: HexFieldProps) {
  const inputId = useId()
  const errorId = useId()
  const [text, setText] = useState(color)
  const [hasError, setHasError] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const hex = normalizeHex(text)
    if (!hex) {
      setHasError(true)
      return
    }
    setHasError(false)
    if (hex === color) setText(hex)
    else onColorChange(hex)
  }

  return (
    <form className="palette-hex" onSubmit={handleSubmit} noValidate>
      <label htmlFor={inputId}>{ID.editor.hexLabel}</label>
      <div className="palette-hex-row">
        <input
          id={inputId}
          className="palette-hex-input"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          maxLength={9}
          value={text}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          onChange={(e) => {
            setText(e.target.value)
            setHasError(false)
          }}
        />
        <button type="submit" className="palette-hex-apply">
          {ID.editor.hexApply}
        </button>
      </div>
      {hasError && (
        <p id={errorId} className="palette-error" role="alert">
          {ID.editor.hexInvalid}
        </p>
      )}
    </form>
  )
}

type SwatchListProps = {
  title: string
  colors: readonly string[]
  active: string
  emptyText?: string
  onPick: (color: string) => void
}

function SwatchList({ title, colors, active, emptyText, onPick }: SwatchListProps) {
  const titleId = useId()
  return (
    <div className="palette-group">
      <h2 id={titleId} className="palette-title">
        {title}
      </h2>
      {colors.length === 0 && emptyText ? (
        <p className="palette-empty">{emptyText}</p>
      ) : (
        <ul className="palette-swatches" aria-labelledby={titleId}>
          {colors.map((swatch) => (
            <li key={swatch}>
              <button
                type="button"
                className="palette-swatch"
                style={{ backgroundColor: swatch }}
                aria-label={ID.editor.pickSwatch(swatch)}
                aria-pressed={swatch === active}
                title={swatch}
                onClick={() => onPick(swatch)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

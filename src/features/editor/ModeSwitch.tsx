import { ID } from '../../i18n/id'
import type { ColoringMode } from '../../types/progress'

const MODES: readonly ColoringMode[] = ['number', 'free']

type Props = {
  mode: ColoringMode
  onChange: (mode: ColoringMode) => void
}

/** Kontrol segmented "Sesuai nomor | Bebas". */
export function ModeSwitch({ mode, onChange }: Props) {
  return (
    <div className="mode-switch" role="group" aria-label={ID.mode.group}>
      {MODES.map((item) => (
        <button
          key={item}
          type="button"
          className="mode-switch-option"
          aria-pressed={item === mode}
          onClick={() => onChange(item)}
        >
          {ID.mode[item]}
        </button>
      ))}
    </div>
  )
}

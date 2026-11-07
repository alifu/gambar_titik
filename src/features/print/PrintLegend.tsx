import { ID } from '../../i18n/id'
import type { PaletteEntry } from '../../types/artwork'

export function PrintLegend({ palette }: { readonly palette: readonly PaletteEntry[] }) {
  return (
    <ul className="print-legend" aria-label={ID.print.legend}>
      {palette.map((entry) => (
        <li key={entry.code} className="print-legend-item">
          <span
            className="print-legend-swatch"
            style={{ backgroundColor: entry.hex }}
            aria-hidden="true"
          />
          <span className="print-legend-code">{entry.code}</span>
          <span className="print-legend-name">{entry.name}</span>
        </li>
      ))}
    </ul>
  )
}

import { ID } from '../../i18n/id'
import type { Artwork } from '../../types/artwork'
import { PrintGrid, type GridVariant } from './PrintGrid'
import { PrintLegend } from './PrintLegend'

type Props = {
  readonly artwork: Artwork
  readonly variant: GridVariant
}

/** Satu halaman cetak: header, grid, legenda. */
export function PrintSheet({ artwork, variant }: Props) {
  const isKey = variant === 'key'
  const label = isKey ? ID.print.keyGridLabel(artwork.title) : ID.print.gridLabel(artwork.title)
  return (
    <section className={isKey ? 'print-sheet print-sheet--key' : 'print-sheet'}>
      <header className="print-sheet-header">
        <h1 className="print-sheet-title">{artwork.title}</h1>
        <p className="print-sheet-subtitle">
          {isKey ? ID.print.answerKeyHeading : ID.print.sheetHeading}
        </p>
      </header>
      <PrintGrid artwork={artwork} variant={variant} label={label} />
      <PrintLegend palette={artwork.palette} />
      <p className="print-sheet-brand">{ID.appName}</p>
    </section>
  )
}

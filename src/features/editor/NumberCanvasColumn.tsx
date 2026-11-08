import { PixelCanvas } from '../../components/PixelCanvas'
import { ID } from '../../i18n/id'
import type { Artwork } from '../../types/artwork'
import type { useNumberWorkspace } from './useNumberWorkspace'

type Props = {
  artwork: Artwork
  workspace: ReturnType<typeof useNumberWorkspace>
}

/** Kanvas mode nomor beserta petunjuk zoom dan pesan kotak salah (untuk pembaca layar). */
export function NumberCanvasColumn({ artwork, workspace }: Props) {
  const { coloring, view, numberView } = workspace
  const selectedCode = artwork.palette[coloring.selected]?.code ?? ''
  return (
    <div className="editor-canvas-column">
      <div className="editor-canvas-area">
        <PixelCanvas
          width={artwork.width}
          height={artwork.height}
          pixels={numberView.pixels}
          labels={numberView.labels}
          flash={coloring.flash}
          viewport={view.viewport}
          isPanMode={workspace.isSpaceHeld}
          label={ID.editor.canvasLabel(artwork.title)}
          onViewportChange={view.update}
          onResize={view.onResize}
          onStrokeStart={coloring.onStrokeStart}
          onStrokeMove={coloring.onStrokeMove}
          onStrokeEnd={coloring.onStrokeEnd}
        />
      </div>
      {workspace.showZoomHint && <p className="number-zoom-hint">{ID.numberMode.zoomHint}</p>}
      <p className="editor-visually-hidden" role="status">
        {coloring.flash ? ID.numberMode.wrongCell(selectedCode) : ''}
      </p>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { PixelCanvas } from '../../components/PixelCanvas'
import {
  isNumberComplete,
  numberDisplayColors,
  numberLabels,
  paletteIndexForKey,
  remainingByPalette,
} from '../../editor/numberMode'
import { snapshotFromProgress } from '../../editor/progress'
import type { Tool } from '../../editor/tools'
import { LABEL_READABLE_ZOOM } from '../../editor/viewport'
import { ID } from '../../i18n/id'
import { computePercent, resolveAllPixelColors } from '../../render/pixelColors'
import type { Artwork } from '../../types/artwork'
import type { Progress } from '../../types/progress'
import { CompletionDialog } from './CompletionDialog'
import { ConfirmDialog } from './ConfirmDialog'
import { EditorActions } from './EditorActions'
import { EditorHeader } from './EditorHeader'
import { NumberLegend } from './NumberLegend'
import { Toolbar, type ToolOption } from './Toolbar'
import { useDownloadPng } from './useDownloadPng'
import { useEditorShortcuts } from './useEditorShortcuts'
import { useNumberColoring, type NumberTool } from './useNumberColoring'
import { useViewportState } from './useViewportState'
import { useWorkspaceState } from './useWorkspaceState'

const NUMBER_TOOLS: readonly ToolOption[] = [
  { tool: 'brush', icon: 'brush', label: ID.numberMode.brush },
  { tool: 'bucket', icon: 'bucket', label: ID.numberMode.fillArea },
]

const isNumberTool = (tool: Tool): tool is NumberTool => tool === 'brush' || tool === 'bucket'

type Props = {
  artwork: Artwork
  progress: Progress | undefined
  userId: string
}

/**
 * Saat gambar berubah dari belum selesai → selesai (bukan saat dibuka sudah selesai),
 * panggil `onComplete` dan buka pesan selesai. Memakai pola "sesuaikan state saat render".
 */
function useCompletion(isComplete: boolean, onComplete: () => void) {
  const [wasComplete, setWasComplete] = useState(isComplete)
  const [isOpen, setIsOpen] = useState(false)
  if (isComplete !== wasComplete) {
    setWasComplete(isComplete)
    if (isComplete) {
      setIsOpen(true)
      onComplete()
    }
  }
  return { isOpen, close: () => setIsOpen(false) }
}

/** Mode "Sesuai nomor": kotak hanya terisi dengan warna yang kodenya sama. */
export function NumberWorkspace({ artwork, progress, userId }: Props) {
  const [initial] = useState(() => snapshotFromProgress(artwork, progress))
  const coloring = useNumberColoring(artwork, initial)
  const view = useViewportState(artwork.width, artwork.height)
  const { colors, selected } = coloring
  const ws = useWorkspaceState({
    userId,
    artwork,
    mode: 'number',
    colors,
    recentColors: initial.recentColors,
    initialCompleted: initial.completed,
  })
  const isComplete = isNumberComplete(artwork, colors)
  const done = useCompletion(isComplete, () => ws.setCompleted(true))
  const png = useDownloadPng(artwork, colors, 'number')
  const isSpaceHeld = useEditorShortcuts({
    onTool: (tool) => isNumberTool(tool) && coloring.setTool(tool),
    onUndo: coloring.undo,
    onRedo: coloring.redo,
    onZoomIn: view.zoomIn,
    onZoomOut: view.zoomOut,
    onZoomReset: view.reset,
    onPlainKey: (key) => {
      const index = paletteIndexForKey(artwork, key)
      if (index !== null) coloring.select(index)
      return index !== null
    },
  })
  const numberView = useNumberView(artwork, colors, selected, ws.isReferenceVisible)
  const showZoomHint =
    !isComplete && !ws.isReferenceVisible && view.viewport.zoom < LABEL_READABLE_ZOOM
  const selectedCode = artwork.palette[selected]?.code ?? ''

  const confirmReset = () => {
    coloring.reset()
    ws.setIsResetOpen(false)
  }

  return (
    <section className="editor editor--number" aria-labelledby="editor-title">
      <EditorHeader
        title={artwork.title}
        mode="number"
        percent={computePercent(artwork, colors, 'number')}
        isCompleted={ws.completed}
        saveStatus={ws.save.status}
        onSaveRetry={ws.save.retry}
        onModeChange={(next) => void ws.switchMode(next)}
      />
      <div className="editor-body">
        <div className="editor-canvas-column">
          <div className="editor-canvas-area">
            <PixelCanvas
              width={artwork.width}
              height={artwork.height}
              pixels={numberView.pixels}
              labels={numberView.labels}
              flash={coloring.flash}
              viewport={view.viewport}
              isPanMode={isSpaceHeld}
              label={ID.editor.canvasLabel(artwork.title)}
              onViewportChange={view.update}
              onResize={view.onResize}
              onStrokeStart={coloring.onStrokeStart}
              onStrokeMove={coloring.onStrokeMove}
              onStrokeEnd={coloring.onStrokeEnd}
            />
          </div>
          {showZoomHint && <p className="number-zoom-hint">{ID.numberMode.zoomHint}</p>}
          <p className="editor-visually-hidden" role="status">
            {coloring.flash ? ID.numberMode.wrongCell(selectedCode) : ''}
          </p>
        </div>
        <aside className="editor-panel">
          <NumberLegend
            palette={artwork.palette}
            remaining={numberView.remaining}
            selected={selected}
            onSelect={coloring.select}
          />
          <Toolbar
            tools={NUMBER_TOOLS}
            tool={coloring.tool}
            brushSize={coloring.brushSize}
            canUndo={coloring.canUndo}
            canRedo={coloring.canRedo}
            onToolChange={(tool) => isNumberTool(tool) && coloring.setTool(tool)}
            onBrushSizeChange={coloring.setBrushSize}
            onUndo={coloring.undo}
            onRedo={coloring.redo}
            onZoomIn={view.zoomIn}
            onZoomOut={view.zoomOut}
            onZoomReset={view.reset}
          />
          <EditorActions
            artwork={artwork}
            colors={colors}
            mode="number"
            isCompleted={ws.completed}
            isReferenceVisible={ws.isReferenceVisible}
            onReferenceChange={ws.setIsReferenceVisible}
            onToggleCompleted={() => ws.setCompleted((c) => !c)}
            onReset={() => ws.setIsResetOpen(true)}
          />
        </aside>
      </div>
      {ws.isResetOpen && (
        <ConfirmDialog
          title={ID.editor.resetTitle}
          message={ID.editor.resetMessage}
          confirmLabel={ID.editor.resetConfirm}
          onConfirm={confirmReset}
          onCancel={() => ws.setIsResetOpen(false)}
        />
      )}
      {done.isOpen && (
        <CompletionDialog
          colors={artwork.palette.map((entry) => entry.hex)}
          downloadError={png.error}
          onClose={done.close}
          onDownload={() => void png.download()}
        />
      )}
    </section>
  )
}

/** Warna, teks kode, dan sisa per kode untuk tampilan mode nomor ("Lihat contoh" = kunci jawaban). */
function useNumberView(
  artwork: Artwork,
  colors: Progress['colors'],
  selected: number,
  isReferenceVisible: boolean,
) {
  return useMemo(
    () => ({
      pixels: isReferenceVisible
        ? resolveAllPixelColors(artwork, colors, 'reference')
        : numberDisplayColors(artwork, colors, selected),
      labels: isReferenceVisible ? undefined : numberLabels(artwork, colors),
      remaining: remainingByPalette(artwork, colors),
    }),
    [artwork, colors, selected, isReferenceVisible],
  )
}

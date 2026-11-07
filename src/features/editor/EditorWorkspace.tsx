import { useMemo, useState } from 'react'
import { PixelCanvas } from '../../components/PixelCanvas'
import { normalizeHex } from '../../editor/color'
import { snapshotFromProgress } from '../../editor/progress'
import { ID } from '../../i18n/id'
import { computePercent, resolveAllPixelColors } from '../../render/pixelColors'
import type { Artwork } from '../../types/artwork'
import type { ColoringMode, Progress } from '../../types/progress'
import { ColorPanel } from './ColorPanel'
import { ConfirmDialog } from './ConfirmDialog'
import { EditorActions } from './EditorActions'
import { EditorHeader } from './EditorHeader'
import { NumberWorkspace } from './NumberWorkspace'
import { Toolbar } from './Toolbar'
import { useColoring } from './useColoring'
import { useEditorShortcuts } from './useEditorShortcuts'
import { useViewportState } from './useViewportState'
import { useWorkspaceState } from './useWorkspaceState'

type Props = {
  artwork: Artwork
  mode: ColoringMode
  progress: Progress | undefined
  userId: string
}

export function EditorWorkspace({ mode, ...props }: Props) {
  return mode === 'number' ? <NumberWorkspace {...props} /> : <FreeWorkspace {...props} />
}

type WorkspaceProps = Omit<Props, 'mode'>

function usePalette(artwork: Artwork): readonly string[] {
  return useMemo(() => {
    const normalized = artwork.palette.map((entry) => normalizeHex(entry.hex))
    return [...new Set(normalized.filter((hex): hex is string => hex !== null))]
  }, [artwork])
}

/** Mode bebas: garis tepi (kode 0) terkunci, alat lengkap, warna apa saja. */
function FreeWorkspace({ artwork, progress, userId }: WorkspaceProps) {
  const [initial] = useState(() => snapshotFromProgress(artwork, progress))
  const coloring = useColoring(artwork, initial)
  const view = useViewportState(artwork.width, artwork.height)
  const palette = usePalette(artwork)
  const { colors, recentColors } = coloring
  const ws = useWorkspaceState({
    userId,
    artwork,
    mode: 'free',
    colors,
    recentColors,
    initialCompleted: initial.completed,
  })
  const isSpaceHeld = useEditorShortcuts({
    onTool: coloring.setTool,
    onUndo: coloring.undo,
    onRedo: coloring.redo,
    onZoomIn: view.zoomIn,
    onZoomOut: view.zoomOut,
    onZoomReset: view.reset,
  })
  const pixels = useMemo(
    () => resolveAllPixelColors(artwork, colors, ws.isReferenceVisible ? 'reference' : 'user'),
    [artwork, colors, ws.isReferenceVisible],
  )

  const confirmReset = () => {
    coloring.reset()
    ws.setIsResetOpen(false)
  }

  return (
    <section className="editor" aria-labelledby="editor-title">
      <EditorHeader
        title={artwork.title}
        mode="free"
        percent={computePercent(artwork, colors, 'free')}
        isCompleted={ws.completed}
        saveStatus={ws.save.status}
        onSaveRetry={ws.save.retry}
        onModeChange={(next) => void ws.switchMode(next)}
      />
      <div className="editor-body">
        <div className="editor-canvas-area">
          <PixelCanvas
            width={artwork.width}
            height={artwork.height}
            pixels={pixels}
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
        <aside className="editor-panel">
          <Toolbar
            tool={coloring.tool}
            brushSize={coloring.brushSize}
            canUndo={coloring.canUndo}
            canRedo={coloring.canRedo}
            onToolChange={coloring.setTool}
            onBrushSizeChange={coloring.setBrushSize}
            onUndo={coloring.undo}
            onRedo={coloring.redo}
            onZoomIn={view.zoomIn}
            onZoomOut={view.zoomOut}
            onZoomReset={view.reset}
          />
          <ColorPanel
            color={coloring.color}
            palette={palette}
            recent={recentColors}
            onColorChange={coloring.setColor}
          />
          <EditorActions
            artwork={artwork}
            colors={colors}
            mode="free"
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
    </section>
  )
}

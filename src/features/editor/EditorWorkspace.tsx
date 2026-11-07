import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PixelCanvas } from '../../components/PixelCanvas'
import { normalizeHex } from '../../editor/color'
import { snapshotFromProgress, type EditorSnapshot } from '../../editor/progress'
import { ID } from '../../i18n/id'
import { computePercent, resolveAllPixelColors } from '../../render/pixelColors'
import type { Artwork } from '../../types/artwork'
import type { Progress } from '../../types/progress'
import { galleryPathWithQuery } from '../gallery/galleryPath'
import { ColorPanel } from './ColorPanel'
import { ConfirmDialog } from './ConfirmDialog'
import { EditorActions } from './EditorActions'
import { SaveIndicator } from './SaveIndicator'
import { Toolbar } from './Toolbar'
import { useAutoSave } from './useAutoSave'
import { useColoring } from './useColoring'
import { useEditorShortcuts } from './useEditorShortcuts'
import { useViewportState } from './useViewportState'

type Props = {
  artwork: Artwork
  progress: Progress | undefined
  userId: string
}

function usePalette(artwork: Artwork): readonly string[] {
  return useMemo(() => {
    const normalized = artwork.palette.map((entry) => normalizeHex(entry.hex))
    return [...new Set(normalized.filter((hex): hex is string => hex !== null))]
  }, [artwork])
}

export function EditorWorkspace({ artwork, progress, userId }: Props) {
  const [initial] = useState(() => snapshotFromProgress(artwork, progress))
  const coloring = useColoring(artwork, initial)
  const view = useViewportState(artwork.width, artwork.height)
  const palette = usePalette(artwork)
  const [completed, setCompleted] = useState(initial.completed)
  const [isReferenceVisible, setIsReferenceVisible] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const { colors, recentColors } = coloring

  const snapshot = useMemo<EditorSnapshot>(
    () => ({ colors, completed, recentColors }),
    [colors, completed, recentColors],
  )
  const save = useAutoSave(userId, artwork, snapshot)
  const isSpaceHeld = useEditorShortcuts({
    onTool: coloring.setTool,
    onUndo: coloring.undo,
    onRedo: coloring.redo,
    onZoomIn: view.zoomIn,
    onZoomOut: view.zoomOut,
    onZoomReset: view.reset,
  })
  const pixels = useMemo(
    () => resolveAllPixelColors(artwork, colors, isReferenceVisible ? 'reference' : 'user'),
    [artwork, colors, isReferenceVisible],
  )

  const confirmReset = () => {
    coloring.reset()
    setIsResetOpen(false)
  }

  return (
    <section className="editor" aria-labelledby="editor-title">
      <header className="editor-header">
        <Link to={galleryPathWithQuery()} className="editor-back">
          {ID.editor.backToGallery}
        </Link>
        <h1 id="editor-title" className="editor-title">
          {artwork.title}
        </h1>
        <p className="editor-status">
          <span className="editor-percent">
            {ID.editor.progress(computePercent(artwork, colors))}
          </span>
          {completed && <span className="editor-badge">{ID.editor.completedBadge}</span>}
          <SaveIndicator status={save.status} onRetry={save.retry} />
        </p>
      </header>
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
            isCompleted={completed}
            isReferenceVisible={isReferenceVisible}
            onReferenceChange={setIsReferenceVisible}
            onToggleCompleted={() => setCompleted((c) => !c)}
            onReset={() => setIsResetOpen(true)}
          />
        </aside>
      </div>
      {isResetOpen && (
        <ConfirmDialog
          title={ID.editor.resetTitle}
          message={ID.editor.resetMessage}
          confirmLabel={ID.editor.resetConfirm}
          onConfirm={confirmReset}
          onCancel={() => setIsResetOpen(false)}
        />
      )}
    </section>
  )
}

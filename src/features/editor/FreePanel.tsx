import type { Artwork } from '../../types/artwork'
import { ColorPanel } from './ColorPanel'
import { EditorActions } from './EditorActions'
import { Toolbar } from './Toolbar'
import type { useFreeWorkspace } from './useFreeWorkspace'

type Props = {
  artwork: Artwork
  workspace: ReturnType<typeof useFreeWorkspace>
}

/** Panel mode bebas: alat, warna, dan aksi. */
export function FreePanel({ artwork, workspace }: Props) {
  const { coloring, view, ws, palette } = workspace
  return (
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
        recent={coloring.recentColors}
        onColorChange={coloring.setColor}
      />
      <EditorActions
        artwork={artwork}
        colors={coloring.colors}
        mode="free"
        isCompleted={ws.completed}
        isReferenceVisible={ws.isReferenceVisible}
        onReferenceChange={ws.setIsReferenceVisible}
        onToggleCompleted={() => ws.setCompleted((c) => !c)}
        onReset={() => ws.setIsResetOpen(true)}
      />
    </aside>
  )
}

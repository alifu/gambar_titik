import type { Artwork } from '../../types/artwork'
import { ID } from '../../i18n/id'
import { EditorActions } from './EditorActions'
import { NumberLegend } from './NumberLegend'
import { Toolbar, type ToolOption } from './Toolbar'
import { isNumberTool, type useNumberWorkspace } from './useNumberWorkspace'

const NUMBER_TOOLS: readonly ToolOption[] = [
  { tool: 'brush', icon: 'brush', label: ID.numberMode.brush },
  { tool: 'bucket', icon: 'bucket', label: ID.numberMode.fillArea },
]

type Props = {
  artwork: Artwork
  workspace: ReturnType<typeof useNumberWorkspace>
}

/** Panel mode nomor: legenda (strip menempel di bawah layar pada HP), alat, dan aksi. */
export function NumberPanel({ artwork, workspace }: Props) {
  const { coloring, view, ws, numberView } = workspace
  return (
    <aside className="editor-panel">
      <NumberLegend
        palette={artwork.palette}
        remaining={numberView.remaining}
        selected={coloring.selected}
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
        colors={coloring.colors}
        mode="number"
        isCompleted={ws.completed}
        isReferenceVisible={ws.isReferenceVisible}
        onReferenceChange={ws.setIsReferenceVisible}
        onToggleCompleted={() => ws.setCompleted((c) => !c)}
        onReset={() => ws.setIsResetOpen(true)}
      />
    </aside>
  )
}

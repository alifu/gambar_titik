import { BRUSH_SIZES, type BrushSize, type Tool } from '../../editor/tools'
import { ID } from '../../i18n/id'
import { ToolIcon, type IconName } from './ToolIcons'

export interface ToolOption {
  readonly tool: Tool
  readonly icon: IconName
  readonly label: string
}

/** Alat mode bebas. */
const FREE_TOOLS: readonly ToolOption[] = [
  { tool: 'brush', icon: 'brush', label: ID.editor.tool.brush },
  { tool: 'bucket', icon: 'bucket', label: ID.editor.tool.bucket },
  { tool: 'eraser', icon: 'eraser', label: ID.editor.tool.eraser },
  { tool: 'picker', icon: 'picker', label: ID.editor.tool.picker },
]

type Props = {
  /** Daftar alat yang ditampilkan (bawaan: alat mode bebas). */
  tools?: readonly ToolOption[]
  tool: Tool
  brushSize: BrushSize
  canUndo: boolean
  canRedo: boolean
  onToolChange: (tool: Tool) => void
  onBrushSizeChange: (size: BrushSize) => void
  onUndo: () => void
  onRedo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
}

export function Toolbar(props: Props) {
  const { tool, brushSize, tools = FREE_TOOLS } = props
  const isSizeRelevant = tool === 'brush' || tool === 'eraser'
  return (
    <div className="toolbar">
      <div className="toolbar-group" role="group" aria-label={ID.editor.tools}>
        {tools.map((item) => (
          <button
            key={item.tool}
            type="button"
            className="toolbar-button"
            aria-pressed={tool === item.tool}
            aria-label={item.label}
            title={item.label}
            onClick={() => props.onToolChange(item.tool)}
          >
            <ToolIcon name={item.icon} />
          </button>
        ))}
      </div>
      <div className="toolbar-group" role="group" aria-label={ID.editor.brushSize}>
        {BRUSH_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            className="toolbar-button toolbar-button--size"
            aria-pressed={brushSize === size}
            aria-label={ID.editor.brushSizeOption(size)}
            title={ID.editor.brushSizeOption(size)}
            disabled={!isSizeRelevant}
            onClick={() => props.onBrushSizeChange(size)}
          >
            <span aria-hidden="true">{size}</span>
          </button>
        ))}
      </div>
      <div className="toolbar-group" role="group" aria-label={ID.editor.history}>
        <IconButton
          label={ID.editor.undo}
          icon="undo"
          disabled={!props.canUndo}
          onClick={props.onUndo}
        />
        <IconButton
          label={ID.editor.redo}
          icon="redo"
          disabled={!props.canRedo}
          onClick={props.onRedo}
        />
      </div>
      <div className="toolbar-group" role="group" aria-label={ID.editor.zoom}>
        <IconButton label={ID.editor.zoomOut} icon="zoomOut" onClick={props.onZoomOut} />
        <IconButton label={ID.editor.zoomReset} icon="zoomReset" onClick={props.onZoomReset} />
        <IconButton label={ID.editor.zoomIn} icon="zoomIn" onClick={props.onZoomIn} />
      </div>
    </div>
  )
}

type IconButtonProps = {
  label: string
  icon: IconName
  disabled?: boolean
  onClick: () => void
}

function IconButton({ label, icon, disabled = false, onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      className="toolbar-button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <ToolIcon name={icon} />
    </button>
  )
}

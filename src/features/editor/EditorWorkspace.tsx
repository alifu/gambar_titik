import { PixelCanvas } from '../../components/PixelCanvas'
import { ID } from '../../i18n/id'
import { computePercent } from '../../render/pixelColors'
import type { Artwork } from '../../types/artwork'
import type { ColoringMode, Progress } from '../../types/progress'
import { EditorHeader } from './EditorHeader'
import { FreePanel } from './FreePanel'
import { NumberWorkspace } from './NumberWorkspace'
import { ResetDialog } from './ResetDialog'
import { useFreeWorkspace } from './useFreeWorkspace'

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

/** Mode bebas: garis tepi (kode 0) terkunci, alat lengkap, warna apa saja. */
function FreeWorkspace({ artwork, progress, userId }: WorkspaceProps) {
  const workspace = useFreeWorkspace(artwork, progress, userId)
  const { coloring, view, ws } = workspace

  return (
    <section className="editor" aria-labelledby="editor-title">
      <EditorHeader
        title={artwork.title}
        mode="free"
        percent={computePercent(artwork, coloring.colors, 'free')}
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
            pixels={workspace.pixels}
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
        <FreePanel artwork={artwork} workspace={workspace} />
      </div>
      {ws.isResetOpen && (
        <ResetDialog onConfirm={workspace.confirmReset} onCancel={() => ws.setIsResetOpen(false)} />
      )}
    </section>
  )
}

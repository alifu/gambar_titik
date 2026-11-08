import { computePercent } from '../../render/pixelColors'
import type { Artwork } from '../../types/artwork'
import type { Progress } from '../../types/progress'
import { CompletionDialog } from './CompletionDialog'
import { EditorHeader } from './EditorHeader'
import { NumberCanvasColumn } from './NumberCanvasColumn'
import { NumberPanel } from './NumberPanel'
import { ResetDialog } from './ResetDialog'
import { useNumberWorkspace } from './useNumberWorkspace'

type Props = {
  artwork: Artwork
  progress: Progress | undefined
  userId: string
}

/** Mode "Sesuai nomor": kotak hanya terisi dengan warna yang kodenya sama. */
export function NumberWorkspace({ artwork, progress, userId }: Props) {
  const workspace = useNumberWorkspace(artwork, progress, userId)
  const { coloring, ws, done, png } = workspace

  return (
    <section className="editor editor--number" aria-labelledby="editor-title">
      <EditorHeader
        title={artwork.title}
        mode="number"
        percent={computePercent(artwork, coloring.colors, 'number')}
        isCompleted={ws.completed}
        saveStatus={ws.save.status}
        onSaveRetry={ws.save.retry}
        onModeChange={(next) => void ws.switchMode(next)}
      />
      <div className="editor-body">
        <NumberCanvasColumn artwork={artwork} workspace={workspace} />
        <NumberPanel artwork={artwork} workspace={workspace} />
      </div>
      {ws.isResetOpen && (
        <ResetDialog onConfirm={workspace.confirmReset} onCancel={() => ws.setIsResetOpen(false)} />
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

import { useState, type MouseEvent } from 'react'
import type { PixelColors } from '../../editor/tools'
import { ID } from '../../i18n/id'
import type { Artwork } from '../../types/artwork'
import { downloadPng } from './downloadPng'
import { errorMessage } from './useEditorData'

type Props = {
  artwork: Artwork
  colors: PixelColors
  isCompleted: boolean
  isReferenceVisible: boolean
  onReferenceChange: (isVisible: boolean) => void
  onToggleCompleted: () => void
  onReset: () => void
}

/** Klik dari keyboard (Enter/Spasi) punya `detail === 0`; klik pointer ≥ 1. */
const isKeyboardClick = (event: MouseEvent) => event.detail === 0

export function EditorActions(props: Props) {
  const { artwork, colors, isCompleted, isReferenceVisible, onReferenceChange } = props
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [isHolding, setIsHolding] = useState(false)

  const hold = (isDown: boolean) => {
    setIsHolding(isDown)
    onReferenceChange(isDown)
  }
  const handleDownload = async () => {
    setDownloadError(null)
    try {
      await downloadPng(artwork, colors)
    } catch (error) {
      setDownloadError(errorMessage(error, ID.editor.downloadFailed))
    }
  }

  return (
    <div className="editor-actions">
      <button
        type="button"
        className="editor-button-secondary"
        aria-pressed={isReferenceVisible}
        aria-describedby="editor-reference-hint"
        onPointerDown={() => hold(true)}
        onPointerUp={() => hold(false)}
        onPointerLeave={() => isHolding && hold(false)}
        onPointerCancel={() => hold(false)}
        onClick={(e) => isKeyboardClick(e) && onReferenceChange(!isReferenceVisible)}
      >
        {ID.editor.showReference}
      </button>
      <span id="editor-reference-hint" className="editor-visually-hidden">
        {ID.editor.showReferenceHint}
      </span>
      <button
        type="button"
        className="editor-button-secondary"
        aria-pressed={isCompleted}
        onClick={props.onToggleCompleted}
      >
        {isCompleted ? ID.editor.markUndone : ID.editor.markDone}
      </button>
      <button type="button" className="editor-button-secondary" onClick={props.onReset}>
        {ID.editor.reset}
      </button>
      <button type="button" onClick={() => void handleDownload()}>
        {ID.editor.download}
      </button>
      {downloadError && (
        <p className="editor-error" role="alert">
          {downloadError}
        </p>
      )}
    </div>
  )
}

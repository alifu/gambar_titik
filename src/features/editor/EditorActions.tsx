import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import type { PixelColors } from '../../editor/tools'
import { ID } from '../../i18n/id'
import type { Artwork } from '../../types/artwork'
import type { ColoringMode } from '../../types/progress'
import { useDownloadPng } from './useDownloadPng'

type Props = {
  artwork: Artwork
  colors: PixelColors
  mode: ColoringMode
  isCompleted: boolean
  isReferenceVisible: boolean
  onReferenceChange: (isVisible: boolean) => void
  onToggleCompleted: () => void
  onReset: () => void
}

/** Klik dari keyboard (Enter/Spasi) punya `detail === 0`; klik pointer ≥ 1. */
const isKeyboardClick = (event: MouseEvent) => event.detail === 0

export function EditorActions(props: Props) {
  const { artwork, colors, mode, isCompleted, isReferenceVisible, onReferenceChange } = props
  const png = useDownloadPng(artwork, colors, mode)
  const [isHolding, setIsHolding] = useState(false)

  const hold = (isDown: boolean) => {
    setIsHolding(isDown)
    onReferenceChange(isDown)
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
      <button type="button" onClick={() => void png.download()}>
        {ID.editor.download}
      </button>
      <Link
        to={`/cetak/${artwork.id}`}
        className="editor-button-secondary"
        aria-label={ID.print.linkLabel(artwork.title)}
      >
        {ID.print.link}
      </Link>
      {png.error && (
        <p className="editor-error" role="alert">
          {png.error}
        </p>
      )}
    </div>
  )
}

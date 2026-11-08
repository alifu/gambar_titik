import { useId, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { ID } from '../../i18n/id'
import { galleryPathWithQuery } from '../gallery/galleryPath'

type Props = {
  /** Warna palet untuk hiasan kotak kecil (animasi; diam jika reduced-motion). */
  colors: readonly string[]
  downloadError: string | null
  onClose: () => void
  onDownload: () => void
}

/** Pesan "Selesai! 🎉" setelah semua kotak mode nomor benar. */
export function CompletionDialog({ colors, downloadError, onClose, onDownload }: Props) {
  const titleId = useId()
  const messageId = useId()
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose()
  }
  return (
    <div className="editor-dialog-backdrop">
      <div
        className="editor-dialog number-done"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onKeyDown={handleKeyDown}
      >
        <div className="number-done-confetti" aria-hidden="true">
          {colors.map((color, i) => (
            <span key={color} style={{ backgroundColor: color, animationDelay: `${i * 70}ms` }} />
          ))}
        </div>
        <h2 id={titleId}>{ID.numberMode.doneTitle}</h2>
        <p id={messageId}>{ID.numberMode.doneMessage}</p>
        {downloadError && (
          <p className="editor-error" role="alert">
            {downloadError}
          </p>
        )}
        <div className="editor-dialog-actions number-done-actions">
          <button type="button" className="editor-button-secondary" onClick={onClose} autoFocus>
            {ID.numberMode.viewResult}
          </button>
          <button type="button" onClick={onDownload}>
            {ID.editor.download}
          </button>
          <Link to={galleryPathWithQuery()} className="number-done-back">
            {ID.editor.backToGallery}
          </Link>
        </div>
      </div>
    </div>
  )
}

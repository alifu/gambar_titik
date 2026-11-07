import { useId, type KeyboardEvent } from 'react'
import { ID } from '../../i18n/id'

type Props = {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: Props) {
  const titleId = useId()
  const messageId = useId()
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onCancel()
  }
  return (
    <div className="editor-dialog-backdrop">
      <div
        className="editor-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId}>{title}</h2>
        <p id={messageId}>{message}</p>
        <div className="editor-dialog-actions">
          <button type="button" className="editor-button-secondary" onClick={onCancel} autoFocus>
            {ID.editor.cancel}
          </button>
          <button type="button" className="editor-button-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

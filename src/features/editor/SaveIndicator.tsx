import { ID } from '../../i18n/id'
import type { SaveStatus } from './useAutoSave'

type Props = {
  status: SaveStatus
  onRetry: () => void
}

export function SaveIndicator({ status, onRetry }: Props) {
  if (status.kind === 'error') {
    return (
      <span className="editor-save editor-save--error" role="alert">
        {status.message}{' '}
        <button type="button" className="editor-button-secondary" onClick={onRetry}>
          {ID.editor.saveRetry}
        </button>
      </span>
    )
  }
  const text = { idle: '', saving: ID.editor.saving, saved: ID.editor.saved }[status.kind]
  return (
    <span className="editor-save" role="status" aria-live="polite">
      {text}
    </span>
  )
}

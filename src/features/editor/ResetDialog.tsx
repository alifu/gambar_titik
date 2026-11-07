import { ID } from '../../i18n/id'
import { ConfirmDialog } from './ConfirmDialog'

type Props = {
  onConfirm: () => void
  onCancel: () => void
}

/** Konfirmasi reset gambar, dipakai kedua mode. */
export function ResetDialog({ onConfirm, onCancel }: Props) {
  return (
    <ConfirmDialog
      title={ID.editor.resetTitle}
      message={ID.editor.resetMessage}
      confirmLabel={ID.editor.resetConfirm}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

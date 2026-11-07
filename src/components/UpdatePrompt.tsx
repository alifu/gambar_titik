import { useRegisterSW } from 'virtual:pwa-register/react'
import { ID } from '../i18n/id'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) {
    return null
  }

  return (
    <div className="update-prompt" role="alert">
      <p>{ID.update.message}</p>
      <button type="button" onClick={() => void updateServiceWorker(true)}>
        {ID.update.button}
      </button>
    </div>
  )
}

import { ID } from '../i18n/id'
import { useOnlineStatus } from '../pwa/useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  return (
    <div role="status" aria-live="polite">
      {!isOnline && <p className="offline-banner">{ID.offline.message}</p>}
    </div>
  )
}

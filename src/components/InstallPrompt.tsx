import { ID } from '../i18n/id'
import { useInstallPrompt } from '../pwa/useInstallPrompt'

export function InstallPrompt() {
  const { canInstall, install, dismiss } = useInstallPrompt()
  if (!canInstall) return null

  return (
    <div className="banner banner--install" role="region" aria-label={ID.install.region}>
      <p>{ID.install.message}</p>
      <div className="banner-actions">
        <button type="button" onClick={() => void install()}>
          {ID.install.button}
        </button>
        <button type="button" className="banner-secondary" onClick={dismiss}>
          {ID.install.dismiss}
        </button>
      </div>
    </div>
  )
}

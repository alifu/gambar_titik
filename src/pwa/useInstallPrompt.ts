import { useCallback, useEffect, useState } from 'react'

/** Event non-standar Chromium; belum ada di lib.dom. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STANDALONE_QUERY = '(display-mode: standalone)'

function isStandalone(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(STANDALONE_QUERY).matches
}

export interface InstallPromptState {
  /** true jika browser menawarkan pemasangan dan aplikasi belum terpasang. */
  readonly canInstall: boolean
  readonly install: () => Promise<void>
  readonly dismiss: () => void
}

/** Menangkap `beforeinstallprompt` agar bisa dipicu dari tombol sendiri. */
export function useInstallPrompt(): InstallPromptState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setDeferred(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }, [deferred])

  const dismiss = useCallback(() => setDeferred(null), [])
  return { canInstall: deferred !== null && !isStandalone(), install, dismiss }
}

import { useCallback, useEffect, useState } from 'react'
import { getArtworkById } from '../../data/artworks'
import { ID } from '../../i18n/id'
import type { Artwork } from '../../types/artwork'

export type PrintState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'not-found' }
  | { readonly status: 'ready'; readonly artwork: Artwork }

const LOADING: PrintState = { status: 'loading' }

function toMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : ID.editor.loadFailed
}

/** Muat gambar untuk lembar cetak. `retry` mengulang pemuatan setelah gagal. */
export function usePrintData(artId: string): { state: PrintState; retry: () => void } {
  const [state, setState] = useState<PrintState>(LOADING)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    getArtworkById(artId)
      .then((artwork) => {
        if (cancelled) return
        setState(artwork ? { status: 'ready', artwork } : { status: 'not-found' })
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: 'error', message: toMessage(error) })
      })
    return () => {
      cancelled = true
    }
  }, [artId, attempt])

  const retry = useCallback(() => {
    setState(LOADING)
    setAttempt((n) => n + 1)
  }, [])

  return { state, retry }
}

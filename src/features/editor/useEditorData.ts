import { useEffect, useState } from 'react'
import { getArtworkById } from '../../data/artworks'
import { ID } from '../../i18n/id'
import { getProgress } from '../../storage/repository'
import type { Artwork } from '../../types/artwork'
import type { ColoringMode, Progress } from '../../types/progress'

export type EditorDataState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'not-found' }
  | { readonly status: 'ready'; readonly artwork: Artwork; readonly progress: Progress | undefined }

const LOADING: EditorDataState = { status: 'loading' }

export const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback

async function loadEditorData(
  artId: string,
  userId: string,
  mode: ColoringMode,
): Promise<EditorDataState> {
  const artwork = await getArtworkById(artId)
  if (!artwork) return { status: 'not-found' }
  const progress = await getProgress(userId, artId, mode)
  return { status: 'ready', artwork, progress }
}

/** Muat artwork + progres user. `retry` memuat ulang setelah error. */
export function useEditorData(artId: string, userId: string, mode: ColoringMode = 'free') {
  const [state, setState] = useState<EditorDataState>(LOADING)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let isActive = true
    loadEditorData(artId, userId, mode).then(
      (next) => {
        if (isActive) setState(next)
      },
      (error: unknown) => {
        if (isActive)
          setState({ status: 'error', message: errorMessage(error, ID.editor.loadFailed) })
      },
    )
    return () => {
      isActive = false
    }
  }, [artId, userId, mode, attempt])

  const retry = () => {
    setState(LOADING)
    setAttempt((n) => n + 1)
  }
  return { state, retry }
}

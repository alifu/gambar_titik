import { useEffect, useState } from 'react'
import { getArtworkById } from '../../data/artworks'
import { ID } from '../../i18n/id'
import { latestOf, resolveMode } from '../../editor/modeParam'
import { getProgress } from '../../storage/repository'
import type { Artwork } from '../../types/artwork'
import type { ColoringMode, Progress } from '../../types/progress'

export type EditorDataState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'not-found' }
  | {
      readonly status: 'ready'
      readonly artwork: Artwork
      readonly mode: ColoringMode
      readonly progress: Progress | undefined
    }

const LOADING: EditorDataState = { status: 'loading' }

export const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback

/** Progres untuk mode yang diminta; tanpa permintaan, mode progres terbaru (atau mode bawaan). */
async function loadModeProgress(
  userId: string,
  artId: string,
  requested: ColoringMode | null,
): Promise<{ mode: ColoringMode; progress: Progress | undefined }> {
  if (requested) return { mode: requested, progress: await getProgress(userId, artId, requested) }
  const [number, free] = await Promise.all([
    getProgress(userId, artId, 'number'),
    getProgress(userId, artId, 'free'),
  ])
  const mode = resolveMode(null, latestOf([number, free]))
  return { mode, progress: mode === 'number' ? number : free }
}

async function loadEditorData(
  artId: string,
  userId: string,
  requested: ColoringMode | null,
): Promise<EditorDataState> {
  const artwork = await getArtworkById(artId)
  if (!artwork) return { status: 'not-found' }
  const { mode, progress } = await loadModeProgress(userId, artId, requested)
  return { status: 'ready', artwork, mode, progress }
}

/**
 * Muat artwork + progres user. `mode` null = pakai mode terakhir gambar itu (atau mode bawaan).
 * `retry` memuat ulang setelah error.
 */
export function useEditorData(artId: string, userId: string, mode: ColoringMode | null = null) {
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

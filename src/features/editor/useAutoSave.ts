import { useCallback, useEffect, useRef, useState } from 'react'
import { buildProgress, type EditorSnapshot } from '../../editor/progress'
import { ID } from '../../i18n/id'
import { saveProgress } from '../../storage/repository'
import type { Artwork } from '../../types/artwork'
import { errorMessage } from './useEditorData'

export const AUTOSAVE_DELAY_MS = 500

export type SaveStatus =
  | { readonly kind: 'idle' }
  | { readonly kind: 'saving' }
  | { readonly kind: 'saved' }
  | { readonly kind: 'error'; readonly message: string }

interface SaveState {
  readonly saved: EditorSnapshot | null
  readonly isSaving: boolean
  readonly error: string | null
}

function deriveStatus(
  state: SaveState,
  snapshot: EditorSnapshot,
  baseline: EditorSnapshot,
): SaveStatus {
  if (state.error !== null) return { kind: 'error', message: state.error }
  const isUnsaved = snapshot !== (state.saved ?? baseline)
  if (state.isSaving || isUnsaved) return { kind: 'saving' }
  return state.saved === null ? { kind: 'idle' } : { kind: 'saved' }
}

/** Laporkan error yang tidak bisa lagi ditampilkan di UI (halaman sudah ditutup). */
function reportUnmountedError(error: unknown) {
  globalThis.reportError?.(error)
}

/**
 * Auto-save ke IndexedDB dengan debounce. Snapshot awal tidak disimpan ulang.
 * Perubahan yang belum tersimpan langsung disimpan saat halaman disembunyikan/ditutup atau unmount.
 */
export function useAutoSave(userId: string, artwork: Artwork, snapshot: EditorSnapshot) {
  const [baseline] = useState(snapshot)
  const [state, setState] = useState<SaveState>({ saved: null, isSaving: false, error: null })
  const pendingRef = useRef<EditorSnapshot | null>(null)
  const latestRef = useRef(snapshot)
  const seqRef = useRef(0)
  const isMountedRef = useRef(true)
  const persisted = state.saved ?? baseline

  const save = useCallback(
    async (snap: EditorSnapshot) => {
      const seq = ++seqRef.current
      setState((s) => ({ ...s, isSaving: true, error: null }))
      try {
        await saveProgress(userId, buildProgress(artwork, snap, Date.now()))
        if (seq === seqRef.current) setState({ saved: snap, isSaving: false, error: null })
      } catch (error) {
        if (!isMountedRef.current) reportUnmountedError(error)
        if (seq !== seqRef.current) return
        const message = ID.editor.saveFailed(errorMessage(error, ''))
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
    },
    [userId, artwork],
  )

  const flush = useCallback(() => {
    const snap = pendingRef.current
    pendingRef.current = null
    if (snap) void save(snap)
  }, [save])

  useEffect(() => {
    latestRef.current = snapshot
    pendingRef.current = snapshot === persisted ? null : snapshot
    if (pendingRef.current === null) return
    const timer = setTimeout(flush, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [snapshot, persisted, flush])

  useEffect(() => {
    isMountedRef.current = true
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onHide)
      isMountedRef.current = false
      flush()
    }
  }, [flush])

  const retry = () => void save(latestRef.current)
  return { status: deriveStatus(state, snapshot, baseline), retry }
}

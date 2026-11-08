import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MODE_PARAM, modeParamValue } from '../../editor/modeParam'
import type { EditorSnapshot } from '../../editor/progress'
import type { PixelColors } from '../../editor/tools'
import type { Artwork } from '../../types/artwork'
import type { ColoringMode } from '../../types/progress'
import { useAutoSave } from './useAutoSave'

interface WorkspaceInput {
  readonly userId: string
  readonly artwork: Artwork
  readonly mode: ColoringMode
  readonly colors: PixelColors
  readonly recentColors: readonly string[]
  readonly initialCompleted: boolean
}

/**
 * State yang sama di kedua mode: tanda selesai, auto-save, "Lihat contoh", dialog reset, dan
 * ganti mode (progres disimpan dulu; jika gagal, mode tidak diganti dan error tampil di status).
 */
export function useWorkspaceState(input: WorkspaceInput) {
  const { userId, artwork, mode, colors, recentColors } = input
  const [completed, setCompleted] = useState(input.initialCompleted)
  const [isReferenceVisible, setIsReferenceVisible] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [, setSearchParams] = useSearchParams()
  const snapshot = useMemo<EditorSnapshot>(
    () => ({ colors, completed, recentColors }),
    [colors, completed, recentColors],
  )
  const save = useAutoSave(userId, artwork, snapshot, mode)

  const switchMode = async (next: ColoringMode) => {
    if (next === mode || !(await save.saveNow())) return
    setSearchParams(
      (params) => {
        const updated = new URLSearchParams(params)
        updated.set(MODE_PARAM, modeParamValue(next))
        return updated
      },
      { replace: true },
    )
  }

  return {
    completed,
    setCompleted,
    isReferenceVisible,
    setIsReferenceVisible,
    isResetOpen,
    setIsResetOpen,
    save,
    switchMode,
  }
}

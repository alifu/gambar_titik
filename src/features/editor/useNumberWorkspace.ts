import { useMemo, useState } from 'react'
import {
  isNumberComplete,
  numberDisplayColors,
  numberLabels,
  paletteIndexForKey,
  remainingByPalette,
} from '../../editor/numberMode'
import { snapshotFromProgress } from '../../editor/progress'
import type { Tool } from '../../editor/tools'
import { LABEL_READABLE_ZOOM } from '../../editor/viewport'
import { resolveAllPixelColors } from '../../render/pixelColors'
import type { Artwork } from '../../types/artwork'
import type { Progress } from '../../types/progress'
import { useDownloadPng } from './useDownloadPng'
import { useEditorShortcuts } from './useEditorShortcuts'
import { useNumberColoring, type NumberTool } from './useNumberColoring'
import { useViewportState } from './useViewportState'
import { useWorkspaceState } from './useWorkspaceState'

export const isNumberTool = (tool: Tool): tool is NumberTool =>
  tool === 'brush' || tool === 'bucket'

/**
 * Saat gambar berubah dari belum selesai → selesai (bukan saat dibuka sudah selesai),
 * panggil `onComplete` dan buka pesan selesai. Memakai pola "sesuaikan state saat render".
 */
function useCompletion(isComplete: boolean, onComplete: () => void) {
  const [wasComplete, setWasComplete] = useState(isComplete)
  const [isOpen, setIsOpen] = useState(false)
  if (isComplete !== wasComplete) {
    setWasComplete(isComplete)
    if (isComplete) {
      setIsOpen(true)
      onComplete()
    }
  }
  return { isOpen, close: () => setIsOpen(false) }
}

/** Warna, teks kode, dan sisa per kode untuk tampilan mode nomor ("Lihat contoh" = kunci jawaban). */
function useNumberView(
  artwork: Artwork,
  colors: Progress['colors'],
  selected: number,
  isReferenceVisible: boolean,
) {
  return useMemo(
    () => ({
      pixels: isReferenceVisible
        ? resolveAllPixelColors(artwork, colors, 'reference')
        : numberDisplayColors(artwork, colors, selected),
      labels: isReferenceVisible ? undefined : numberLabels(artwork, colors),
      remaining: remainingByPalette(artwork, colors),
    }),
    [artwork, colors, selected, isReferenceVisible],
  )
}

/** Seluruh state dan perilaku editor mode "Sesuai nomor". */
export function useNumberWorkspace(
  artwork: Artwork,
  progress: Progress | undefined,
  userId: string,
) {
  const [initial] = useState(() => snapshotFromProgress(artwork, progress))
  const coloring = useNumberColoring(artwork, initial)
  const view = useViewportState(artwork.width, artwork.height, true)
  const { colors, selected } = coloring
  const ws = useWorkspaceState({
    userId,
    artwork,
    mode: 'number',
    colors,
    recentColors: initial.recentColors,
    initialCompleted: initial.completed,
  })
  const isComplete = isNumberComplete(artwork, colors)
  const done = useCompletion(isComplete, () => ws.setCompleted(true))
  const png = useDownloadPng(artwork, colors, 'number')
  const isSpaceHeld = useEditorShortcuts({
    onTool: (tool) => isNumberTool(tool) && coloring.setTool(tool),
    onUndo: coloring.undo,
    onRedo: coloring.redo,
    onZoomIn: view.zoomIn,
    onZoomOut: view.zoomOut,
    onZoomReset: view.reset,
    onPlainKey: (key) => {
      const index = paletteIndexForKey(artwork, key)
      if (index !== null) coloring.select(index)
      return index !== null
    },
  })
  const numberView = useNumberView(artwork, colors, selected, ws.isReferenceVisible)
  const showZoomHint =
    !isComplete && !ws.isReferenceVisible && view.viewport.zoom < LABEL_READABLE_ZOOM
  const confirmReset = () => {
    coloring.reset()
    ws.setIsResetOpen(false)
  }
  return { coloring, view, ws, done, png, isSpaceHeld, numberView, showZoomHint, confirmReset }
}

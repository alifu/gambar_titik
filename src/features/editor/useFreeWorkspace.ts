import { useMemo, useState } from 'react'
import { normalizeHex } from '../../editor/color'
import { snapshotFromProgress } from '../../editor/progress'
import { resolveAllPixelColors } from '../../render/pixelColors'
import type { Artwork } from '../../types/artwork'
import type { Progress } from '../../types/progress'
import { useColoring } from './useColoring'
import { useEditorShortcuts } from './useEditorShortcuts'
import { useViewportState } from './useViewportState'
import { useWorkspaceState } from './useWorkspaceState'

function usePalette(artwork: Artwork): readonly string[] {
  return useMemo(() => {
    const normalized = artwork.palette.map((entry) => normalizeHex(entry.hex))
    return [...new Set(normalized.filter((hex): hex is string => hex !== null))]
  }, [artwork])
}

/** Seluruh state dan perilaku editor mode bebas. */
export function useFreeWorkspace(artwork: Artwork, progress: Progress | undefined, userId: string) {
  const [initial] = useState(() => snapshotFromProgress(artwork, progress))
  const coloring = useColoring(artwork, initial)
  const view = useViewportState(artwork.width, artwork.height)
  const palette = usePalette(artwork)
  const { colors, recentColors } = coloring
  const ws = useWorkspaceState({
    userId,
    artwork,
    mode: 'free',
    colors,
    recentColors,
    initialCompleted: initial.completed,
  })
  const isSpaceHeld = useEditorShortcuts({
    onTool: coloring.setTool,
    onUndo: coloring.undo,
    onRedo: coloring.redo,
    onZoomIn: view.zoomIn,
    onZoomOut: view.zoomOut,
    onZoomReset: view.reset,
  })
  const pixels = useMemo(
    () => resolveAllPixelColors(artwork, colors, ws.isReferenceVisible ? 'reference' : 'user'),
    [artwork, colors, ws.isReferenceVisible],
  )
  const confirmReset = () => {
    coloring.reset()
    ws.setIsResetOpen(false)
  }
  return { coloring, view, ws, palette, isSpaceHeld, pixels, confirmReset }
}

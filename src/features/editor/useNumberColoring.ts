import { useEffect, useReducer, useRef, useState } from 'react'
import type { FlashMark } from '../../components/PixelCanvas'
import { createDocument, documentReducer, type ColorsUpdate } from '../../editor/document'
import { canRedo, canUndo } from '../../editor/history'
import {
  fillCodeRegion,
  fillMatching,
  firstUnfinishedPalette,
  mismatchedIndices,
} from '../../editor/numberMode'
import type { EditorSnapshot } from '../../editor/progress'
import {
  brushIndices,
  emptyColors,
  lineIndices,
  type BrushSize,
  type PixelColors,
} from '../../editor/tools'
import type { Artwork } from '../../types/artwork'

/** Alat mode nomor: kuas atau isi area (kotak berkode sama yang terhubung). */
export type NumberTool = 'brush' | 'bucket'

/** Lama tanda merah pada kotak yang ditolak. */
export const REJECT_FLASH_MS = 700
/** Batas jumlah kotak yang ditandai sekaligus (drag panjang). */
const MAX_FLASH_CELLS = 24

const clearAll =
  (artwork: Artwork) =>
  (colors: PixelColors): PixelColors =>
    colors.every((c) => c === null) ? colors : emptyColors(artwork)

function useRejectFlash() {
  const [flash, setFlash] = useState<FlashMark | null>(null)
  useEffect(() => {
    if (!flash) return
    const timer = setTimeout(() => setFlash(null), REJECT_FLASH_MS)
    return () => clearTimeout(timer)
  }, [flash])
  const reject = (indices: readonly number[]) => {
    if (indices.length === 0) return
    setFlash((prev) => ({ id: (prev?.id ?? 0) + 1, indices: indices.slice(-MAX_FLASH_CELLS) }))
  }
  return { flash, reject }
}

/**
 * State mewarnai mode nomor: kotak hanya terisi jika kodenya sama dengan warna terpilih.
 * Kotak berkode lain ditandai sebentar (`flash`) dan tidak berubah.
 */
export function useNumberColoring(artwork: Artwork, initial: EditorSnapshot) {
  const [doc, dispatch] = useReducer(documentReducer, initial.colors, createDocument)
  const [tool, setTool] = useState<NumberTool>('brush')
  const [brushSize, setBrushSize] = useState<BrushSize>(1)
  const [selected, setSelected] = useState(() => firstUnfinishedPalette(artwork, initial.colors))
  const { flash, reject } = useRejectFlash()
  const lastIndexRef = useRef<number | null>(null)
  const colors = doc.history.present

  const paintAlong = (from: number, to: number): ColorsUpdate => {
    const indices = lineIndices(artwork, from, to).flatMap((i) =>
      brushIndices(artwork, i, brushSize),
    )
    reject(mismatchedIndices(artwork, colors, indices, selected))
    return (current) => fillMatching(artwork, current, indices, selected)
  }

  const onStrokeStart = (index: number) => {
    lastIndexRef.current = index
    if (tool === 'bucket') {
      reject(mismatchedIndices(artwork, colors, [index], selected))
      dispatch({ type: 'apply', update: (c) => fillCodeRegion(artwork, c, index, selected) })
      return
    }
    dispatch({ type: 'stroke-start' })
    dispatch({ type: 'stroke-apply', update: paintAlong(index, index) })
  }

  const onStrokeMove = (index: number) => {
    const from = lastIndexRef.current
    lastIndexRef.current = index
    if (from === null || tool !== 'brush') return
    dispatch({ type: 'stroke-apply', update: paintAlong(from, index) })
  }

  const onStrokeEnd = () => {
    lastIndexRef.current = null
    dispatch({ type: 'stroke-end' })
  }

  return {
    colors,
    tool,
    brushSize,
    selected,
    flash,
    canUndo: canUndo(doc.history),
    canRedo: canRedo(doc.history),
    setTool,
    setBrushSize,
    select: setSelected,
    onStrokeStart,
    onStrokeMove,
    onStrokeEnd,
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
    reset: () => dispatch({ type: 'apply', update: clearAll(artwork) }),
  }
}

import { useReducer, useRef, useState } from 'react'
import { addRecentColor, normalizeHex } from '../../editor/color'
import { createDocument, documentReducer } from '../../editor/document'
import { canRedo, canUndo } from '../../editor/history'
import type { EditorSnapshot } from '../../editor/progress'
import {
  brushIndices,
  emptyColors,
  floodFill,
  lineIndices,
  paintPixels,
  pickColor,
  type BrushSize,
  type PixelColors,
  type Tool,
} from '../../editor/tools'
import type { Artwork } from '../../types/artwork'

const DEFAULT_COLOR = '#000000'

function initialColor(artwork: Artwork, initial: EditorSnapshot): string {
  const candidate =
    initial.recentColors[0] ?? (artwork.palette[1] ?? artwork.palette[0])?.hex ?? DEFAULT_COLOR
  return normalizeHex(candidate) ?? DEFAULT_COLOR
}

const clearAll =
  (artwork: Artwork) =>
  (colors: PixelColors): PixelColors =>
    colors.every((c) => c === null) ? colors : emptyColors(artwork)

/** State mewarnai: warna pixel + riwayat, alat, ukuran kuas, warna aktif, warna terakhir. */
export function useColoring(artwork: Artwork, initial: EditorSnapshot) {
  const [doc, dispatch] = useReducer(documentReducer, initial.colors, createDocument)
  const [tool, setTool] = useState<Tool>('brush')
  const [brushSize, setBrushSize] = useState<BrushSize>(1)
  const [color, setColor] = useState(() => initialColor(artwork, initial))
  const [recentColors, setRecentColors] = useState(initial.recentColors)
  const lastIndexRef = useRef<number | null>(null)
  const colors = doc.history.present

  const rememberColor = () => setRecentColors((recent) => addRecentColor(recent, color))
  const paintAlong = (from: number, to: number) => {
    const indices = lineIndices(artwork, from, to).flatMap((i) =>
      brushIndices(artwork, i, brushSize),
    )
    const paintColor = tool === 'eraser' ? null : color
    return (current: PixelColors) => paintPixels(artwork, current, indices, paintColor)
  }

  const onStrokeStart = (index: number) => {
    lastIndexRef.current = index
    if (tool === 'picker') {
      const picked = pickColor(artwork, colors, index)
      if (picked) {
        setColor(picked)
        setTool('brush')
      }
      return
    }
    if (tool === 'bucket') {
      dispatch({ type: 'apply', update: (current) => floodFill(artwork, current, index, color) })
      rememberColor()
      return
    }
    dispatch({ type: 'stroke-start' })
    dispatch({ type: 'stroke-apply', update: paintAlong(index, index) })
    if (tool === 'brush') rememberColor()
  }

  const onStrokeMove = (index: number) => {
    const from = lastIndexRef.current
    lastIndexRef.current = index
    if (from === null || (tool !== 'brush' && tool !== 'eraser')) return
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
    color,
    recentColors,
    canUndo: canUndo(doc.history),
    canRedo: canRedo(doc.history),
    setTool,
    setBrushSize,
    setColor,
    onStrokeStart,
    onStrokeMove,
    onStrokeEnd,
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
    reset: () => dispatch({ type: 'apply', update: clearAll(artwork) }),
  }
}

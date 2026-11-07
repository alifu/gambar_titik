import { useEffect, useRef } from 'react'
import { BACKGROUND_SYMBOL } from '../types/artwork'

/** Resolusi satu kotak di canvas label (px perangkat), dibulatkan agar tidak sering digambar ulang. */
const CELL_PX_STEP = 8
const MIN_CELL_PX = 16
const MAX_CELL_PX = 40
const FONT_RATIO = 0.7
const CODE_COLOR = '#3b3447'
const DOT_COLOR = '#a8a1b3'

/** Ukuran kotak di canvas label untuk zoom layar & devicePixelRatio tertentu. */
function labelCellPx(zoom: number, pixelRatio: number): number {
  const target = Math.ceil((zoom * pixelRatio) / CELL_PX_STEP) * CELL_PX_STEP
  return Math.min(MAX_CELL_PX, Math.max(MIN_CELL_PX, target))
}

interface Drawn {
  readonly labels: readonly string[]
  readonly cellPx: number
}

/** Gambar ulang hanya kotak yang teksnya berubah (semua kotak jika resolusi berubah). */
function drawChangedLabels(
  canvas: HTMLCanvasElement | null,
  width: number,
  cellPx: number,
  previous: readonly string[] | null,
  next: readonly string[],
): boolean {
  const ctx = canvas?.getContext('2d')
  if (!ctx) return false
  ctx.font = `700 ${Math.round(cellPx * FONT_RATIO)}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  next.forEach((text, i) => {
    if (previous?.[i] === text) return
    const x = (i % width) * cellPx
    const y = Math.floor(i / width) * cellPx
    ctx.clearRect(x, y, cellPx, cellPx)
    if (!text) return
    ctx.fillStyle = text === BACKGROUND_SYMBOL ? DOT_COLOR : CODE_COLOR
    ctx.fillText(text, x + cellPx / 2, y + cellPx / 2)
  })
  return true
}

type Props = {
  width: number
  height: number
  /** Teks per kotak ('' = kosong). */
  labels: readonly string[]
  zoom: number
}

/** Lapisan teks kode di atas kanvas pixel (mode nomor). */
export function CellLabels({ width, height, labels, zoom }: Props) {
  const cellPx = labelCellPx(zoom, globalThis.devicePixelRatio || 1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawnRef = useRef<Drawn | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      const drawn = drawnRef.current
      const previous = drawn?.cellPx === cellPx ? drawn.labels : null
      if (drawChangedLabels(canvasRef.current, width, cellPx, previous, labels)) {
        drawnRef.current = { labels, cellPx }
      }
    })
  }, [width, cellPx, labels])

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    },
    [],
  )

  return (
    <canvas
      ref={canvasRef}
      className="editor-canvas-labels"
      data-testid="cell-labels"
      width={width * cellPx}
      height={height * cellPx}
      aria-hidden="true"
    />
  )
}

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import {
  GRID_MIN_ZOOM,
  LABEL_MIN_ZOOM,
  panBy,
  screenToIndex,
  zoomAt,
  type Size,
  type Viewport,
} from '../editor/viewport'
import { CellLabels } from './CellLabels'

const WHEEL_ZOOM_SENSITIVITY = 0.0015
const MIDDLE_BUTTON = 1
const RIGHT_BUTTON = 2
/** Jari pertama menunggu sebentar sebelum mewarnai, agar jari kedua (pinch) bisa membatalkan goresan. */
export const TOUCH_STROKE_DELAY_MS = 80
/** Gerakan jari (px) yang langsung dianggap sebagai goresan, tanpa menunggu jeda. */
export const TOUCH_MOVE_THRESHOLD_PX = 6

type ViewportUpdate = (vp: Viewport) => Viewport

/** Kotak yang ditandai sebentar (mis. ditolak di mode nomor). `id` baru = animasi diulang. */
export interface FlashMark {
  readonly id: number
  readonly indices: readonly number[]
}

type Props = {
  width: number
  height: number
  /** Warna tampilan per pixel (sudah termasuk outline). */
  pixels: readonly string[]
  viewport: Viewport
  /** true saat spasi ditahan: drag = geser kanvas. */
  isPanMode: boolean
  label: string
  /** Teks per kotak (kode warna); ditampilkan mulai LABEL_MIN_ZOOM. */
  labels?: readonly string[]
  flash?: FlashMark | null
  onViewportChange: (update: ViewportUpdate) => void
  onResize: (size: Size) => void
  onStrokeStart: (index: number) => void
  onStrokeMove: (index: number) => void
  onStrokeEnd: () => void
}

interface Point {
  readonly x: number
  readonly y: number
}

type Gesture =
  | { readonly kind: 'none' }
  | {
      readonly kind: 'stroke'
      readonly pointerId: number
      readonly lastIndex: number | null
    }
  | { readonly kind: 'pending'; readonly pointerId: number; readonly origin: Point }
  | { readonly kind: 'pan'; readonly pointerId: number; readonly last: Point }
  | { readonly kind: 'pinch'; readonly distance: number; readonly mid: Point }

const NO_GESTURE: Gesture = { kind: 'none' }

function pinchOf(points: readonly Point[]): { distance: number; mid: Point } {
  const [a, b] = points
  return {
    distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
    mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
  }
}

/** Gambar ulang hanya pixel yang berbeda dari frame sebelumnya. */
function drawChangedPixels(
  canvas: HTMLCanvasElement | null,
  width: number,
  previous: readonly string[] | null,
  next: readonly string[],
): boolean {
  const ctx = canvas?.getContext('2d')
  if (!ctx) return false
  next.forEach((color, i) => {
    if (previous?.[i] === color) return
    ctx.fillStyle = color
    ctx.fillRect(i % width, Math.floor(i / width), 1, 1)
  })
  return true
}

function useCanvasPainter(width: number, pixels: readonly string[]) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawnRef = useRef<readonly string[] | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      if (drawChangedPixels(canvasRef.current, width, drawnRef.current, pixels)) {
        drawnRef.current = pixels
      }
    })
  }, [width, pixels])

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    },
    [],
  )
  return canvasRef
}

function useContainerSize(onResize: (size: Size) => void) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const report = () => onResize({ width: el.clientWidth, height: el.clientHeight })
    report()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(report)
    observer.observe(el)
    return () => observer.disconnect()
  }, [onResize])
  return containerRef
}

function useWheelZoom(
  containerRef: RefObject<HTMLDivElement | null>,
  onViewportChange: (update: ViewportUpdate) => void,
) {
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = el.getBoundingClientRect()
      const factor = Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY)
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      onViewportChange((vp) => zoomAt(vp, factor, x, y))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [containerRef, onViewportChange])
}

/**
 * Kanvas pixel art: canvas berukuran asli (width × height) diperbesar lewat CSS dengan
 * `image-rendering: pixelated`. Tap/drag = goresan, spasi/klik tengah + drag = geser,
 * wheel = zoom, dua jari = zoom + geser.
 */
export function PixelCanvas(props: Props) {
  const { width, height, pixels, viewport, isPanMode, label, labels, flash } = props
  const canvasRef = useCanvasPainter(width, pixels)
  const containerRef = useContainerSize(props.onResize)
  useWheelZoom(containerRef, props.onViewportChange)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const pointersRef = useRef<ReadonlyMap<number, Point>>(new Map())
  const gestureRef = useRef<Gesture>(NO_GESTURE)
  const handlers = usePointerHandlers(props, containerRef, pointersRef, gestureRef, setHoverIndex)

  const zoom = viewport.zoom
  const hoverX = hoverIndex === null ? 0 : hoverIndex % width
  const hoverY = hoverIndex === null ? 0 : Math.floor(hoverIndex / width)
  return (
    <div
      ref={containerRef}
      className={`editor-canvas${isPanMode ? ' editor-canvas--pan' : ''}`}
      {...handlers}
    >
      <div
        className="editor-canvas-stage"
        style={{
          width: width * zoom,
          height: height * zoom,
          transform: `translate(${viewport.panX}px, ${viewport.panY}px)`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="editor-canvas-pixels"
          width={width}
          height={height}
          role="img"
          aria-label={label}
          style={{ imageRendering: 'pixelated' }}
        />
        {labels && zoom >= LABEL_MIN_ZOOM && (
          <CellLabels width={width} height={height} labels={labels} zoom={zoom} />
        )}
        {zoom >= (labels ? LABEL_MIN_ZOOM : GRID_MIN_ZOOM) && (
          <div
            className="editor-canvas-grid"
            data-testid="pixel-grid"
            style={{ backgroundSize: `${zoom}px ${zoom}px` }}
          />
        )}
        {flash?.indices.map((i) => (
          <div
            key={`${flash.id}-${i}`}
            className="number-reject"
            data-testid="reject-mark"
            style={{
              left: (i % width) * zoom,
              top: Math.floor(i / width) * zoom,
              width: zoom,
              height: zoom,
            }}
          />
        ))}
        {hoverIndex !== null && (
          <div
            className="editor-canvas-hover"
            style={{ left: hoverX * zoom, top: hoverY * zoom, width: zoom, height: zoom }}
          />
        )}
      </div>
    </div>
  )
}

type PointerHandlers = {
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void
  onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => void
  onPointerLeave: (e: ReactPointerEvent<HTMLDivElement>) => void
}

function isPastTouchThreshold(g: Gesture, pointerId: number, point: Point): boolean {
  if (g.kind !== 'pending' || g.pointerId !== pointerId) return false
  return Math.hypot(point.x - g.origin.x, point.y - g.origin.y) > TOUCH_MOVE_THRESHOLD_PX
}

function usePointerHandlers(
  props: Props,
  containerRef: RefObject<HTMLDivElement | null>,
  pointersRef: RefObject<ReadonlyMap<number, Point>>,
  gestureRef: RefObject<Gesture>,
  setHoverIndex: (index: number | null) => void,
): PointerHandlers {
  const localPoint = (e: ReactPointerEvent<HTMLDivElement>): Point => {
    const rect = containerRef.current?.getBoundingClientRect()
    return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) }
  }
  const indexAt = (p: Point) =>
    screenToIndex(props.viewport, { width: props.width, height: props.height }, p.x, p.y)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearTimer = () => {
    if (timerRef.current === null) return
    clearTimeout(timerRef.current)
    timerRef.current = null
  }
  useEffect(() => clearTimer, [])

  const setPointers = (update: (map: Map<number, Point>) => void) => {
    const next = new Map(pointersRef.current)
    update(next)
    pointersRef.current = next
  }

  const endStroke = () => {
    const g = gestureRef.current
    if (g.kind === 'stroke' && g.lastIndex !== null) props.onStrokeEnd()
  }

  const strokeTo = (pointerId: number, index: number | null) => {
    const g = gestureRef.current
    if (g.kind !== 'stroke' || index === null || index === g.lastIndex) return
    if (g.lastIndex === null) props.onStrokeStart(index)
    else props.onStrokeMove(index)
    gestureRef.current = { kind: 'stroke', pointerId, lastIndex: index }
  }

  /** Ubah goresan tertunda (sentuh) menjadi goresan nyata di titik awalnya. */
  const commitPending = () => {
    clearTimer()
    const g = gestureRef.current
    if (g.kind !== 'pending') return
    gestureRef.current = { kind: 'stroke', pointerId: g.pointerId, lastIndex: null }
    strokeTo(g.pointerId, indexAt(g.origin))
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button === RIGHT_BUTTON) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const point = localPoint(e)
    setPointers((m) => m.set(e.pointerId, point))
    const points = [...pointersRef.current.values()]
    if (points.length >= 2) {
      clearTimer()
      endStroke()
      gestureRef.current = { kind: 'pinch', ...pinchOf(points) }
    } else if (props.isPanMode || e.button === MIDDLE_BUTTON) {
      gestureRef.current = { kind: 'pan', pointerId: e.pointerId, last: point }
    } else if (e.pointerType === 'touch') {
      gestureRef.current = { kind: 'pending', pointerId: e.pointerId, origin: point }
      timerRef.current = setTimeout(commitPending, TOUCH_STROKE_DELAY_MS)
    } else {
      gestureRef.current = { kind: 'stroke', pointerId: e.pointerId, lastIndex: null }
      strokeTo(e.pointerId, indexAt(point))
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const point = localPoint(e)
    if (e.pointerType !== 'touch') setHoverIndex(indexAt(point))
    if (!pointersRef.current.has(e.pointerId)) return
    setPointers((m) => m.set(e.pointerId, point))
    if (isPastTouchThreshold(gestureRef.current, e.pointerId, point)) commitPending()
    const g = gestureRef.current
    if (g.kind === 'stroke' && g.pointerId === e.pointerId) strokeTo(e.pointerId, indexAt(point))
    if (g.kind === 'pan' && g.pointerId === e.pointerId) {
      props.onViewportChange((vp) => panBy(vp, point.x - g.last.x, point.y - g.last.y))
      gestureRef.current = { ...g, last: point }
    }
    if (g.kind === 'pinch' && pointersRef.current.size >= 2) {
      const next = pinchOf([...pointersRef.current.values()])
      props.onViewportChange((vp) =>
        panBy(
          zoomAt(vp, next.distance / g.distance, next.mid.x, next.mid.y),
          next.mid.x - g.mid.x,
          next.mid.y - g.mid.y,
        ),
      )
      gestureRef.current = { kind: 'pinch', ...next }
    }
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return
    setPointers((m) => m.delete(e.pointerId))
    commitPendingIfOwned(e.pointerId)
    const g = gestureRef.current
    const ownsGesture = g.kind === 'pinch' || (g.kind !== 'none' && g.pointerId === e.pointerId)
    if (!ownsGesture) return
    endStroke()
    gestureRef.current = NO_GESTURE
  }

  const commitPendingIfOwned = (pointerId: number) => {
    const g = gestureRef.current
    if (g.kind === 'pending' && g.pointerId === pointerId) commitPending()
  }

  const onPointerLeave = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch') setHoverIndex(null)
  }

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onPointerLeave }
}

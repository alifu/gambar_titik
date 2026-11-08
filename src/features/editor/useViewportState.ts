import { useCallback, useMemo, useState } from 'react'
import {
  ZOOM_STEP,
  fitViewport,
  readableStartViewport,
  zoomAt,
  type Size,
  type Viewport,
} from '../../editor/viewport'

const EMPTY_SIZE: Size = { width: 0, height: 0 }

/**
 * Zoom/pan kanvas. Selama user belum zoom/geser, tampilan otomatis "pas" dengan kotak kanvas.
 * Dengan `readableStart` (mode nomor) tampilan awal diperbesar agar kode di kotak terbaca;
 * `reset` ("Ukuran awal") selalu kembali ke zoom pas layar.
 */
export function useViewportState(width: number, height: number, readableStart = false) {
  const [container, setContainer] = useState<Size>(EMPTY_SIZE)
  const [custom, setCustom] = useState<Viewport | null>(null)
  const fitted = useMemo(
    () => fitViewport({ width, height }, container),
    [width, height, container],
  )
  const [isFitRequested, setIsFitRequested] = useState(false)
  const start = useMemo(
    () =>
      readableStart && !isFitRequested
        ? readableStartViewport({ width, height }, container)
        : fitted,
    [readableStart, isFitRequested, width, height, container, fitted],
  )
  const viewport = custom ?? start

  const update = useCallback(
    (fn: (vp: Viewport) => Viewport) => setCustom((prev) => fn(prev ?? start)),
    [start],
  )

  const onResize = useCallback((size: Size) => {
    setContainer((prev) => (prev.width === size.width && prev.height === size.height ? prev : size))
  }, [])

  const zoomBy = (factor: number) =>
    update((vp) => zoomAt(vp, factor, container.width / 2, container.height / 2))

  return {
    viewport,
    update,
    onResize,
    zoomIn: () => zoomBy(ZOOM_STEP),
    zoomOut: () => zoomBy(1 / ZOOM_STEP),
    reset: () => {
      setCustom(null)
      setIsFitRequested(true)
    },
  }
}

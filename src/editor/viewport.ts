/**
 * Posisi tampilan kanvas.
 * `zoom` = ukuran satu pixel gambar dalam px layar (CSS).
 * `panX`/`panY` = posisi pojok kiri-atas gambar relatif terhadap kotak kanvas, dalam px layar.
 */
export interface Viewport {
  readonly zoom: number
  readonly panX: number
  readonly panY: number
}

export interface Size {
  readonly width: number
  readonly height: number
}

export const MIN_ZOOM = 1
export const MAX_ZOOM = 64
/** Kelipatan zoom untuk tombol/pintasan +/−. */
export const ZOOM_STEP = 1.25
/** Garis grid ditampilkan mulai zoom ini. */
export const GRID_MIN_ZOOM = 10
/** Ruang kosong di sekitar gambar saat "ukuran awal" (px). */
const FIT_MARGIN = 8

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

/** Zoom sebesar mungkin agar seluruh gambar terlihat, posisi di tengah. */
export function fitViewport(art: Size, container: Size): Viewport {
  const usableW = Math.max(1, container.width - FIT_MARGIN * 2)
  const usableH = Math.max(1, container.height - FIT_MARGIN * 2)
  const zoom = clampZoom(Math.min(usableW / art.width, usableH / art.height))
  return {
    zoom,
    panX: (container.width - art.width * zoom) / 2,
    panY: (container.height - art.height * zoom) / 2,
  }
}

/** Ubah zoom dengan titik layar (anchorX, anchorY) tetap di tempat. */
export function zoomAt(vp: Viewport, factor: number, anchorX: number, anchorY: number): Viewport {
  const zoom = clampZoom(vp.zoom * factor)
  const ratio = zoom / vp.zoom
  return {
    zoom,
    panX: anchorX - (anchorX - vp.panX) * ratio,
    panY: anchorY - (anchorY - vp.panY) * ratio,
  }
}

export function panBy(vp: Viewport, dx: number, dy: number): Viewport {
  return { ...vp, panX: vp.panX + dx, panY: vp.panY + dy }
}

/** Koordinat layar (relatif kotak kanvas) → indeks pixel, atau null jika di luar gambar. */
export function screenToIndex(vp: Viewport, art: Size, x: number, y: number): number | null {
  const px = Math.floor((x - vp.panX) / vp.zoom)
  const py = Math.floor((y - vp.panY) / vp.zoom)
  if (px < 0 || py < 0 || px >= art.width || py >= art.height) return null
  return py * art.width + px
}

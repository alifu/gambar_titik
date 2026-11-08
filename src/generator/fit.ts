/** Hitung `View` untuk memetakan desain ke grid kecil. */
import { topLayer, type Layer, type View } from './raster.ts'

/** Ukuran kanvas desain lama (hewan & makanan), dalam satuan desain. */
export const DESIGN_SIZE = 64
const BOUNDS_STEP = 0.5

export interface Bounds {
  readonly minX: number
  readonly minY: number
  readonly maxX: number
  readonly maxY: number
}

/** Kotak pembatas semua lapisan di area desain [0, size)², atau null jika kosong. */
export function designBounds(layers: readonly Layer[], size = DESIGN_SIZE): Bounds | null {
  const xs: number[] = []
  const ys: number[] = []
  for (let y = BOUNDS_STEP / 2; y < size; y += BOUNDS_STEP) {
    for (let x = BOUNDS_STEP / 2; x < size; x += BOUNDS_STEP) {
      if (topLayer(layers, x, y) === 0) continue
      xs.push(x)
      ys.push(y)
    }
  }
  if (xs.length === 0) return null
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  }
}

/**
 * View yang membuat subjek memenuhi grid (rasio tetap) dengan sisa `margin` kotak di tiap sisi,
 * di tengah grid. Desain kosong dipetakan apa adanya.
 */
export function fitSubject(
  layers: readonly Layer[],
  width: number,
  height: number,
  margin: number,
): View {
  const bounds = designBounds(layers)
  if (bounds === null) return { x0: 0, y0: 0, scaleX: 1, scaleY: 1 }
  const spanX = bounds.maxX - bounds.minX + BOUNDS_STEP
  const spanY = bounds.maxY - bounds.minY + BOUNDS_STEP
  const scale = Math.max(spanX / (width - 2 * margin), spanY / (height - 2 * margin))
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  return {
    x0: centerX - (width / 2) * scale,
    y0: centerY - (height / 2) * scale,
    scaleX: scale,
    scaleY: scale,
  }
}

/** View yang menutup seluruh grid dari area desain designWidth×designHeight (dipotong di tengah). */
export function coverDesign(
  width: number,
  height: number,
  designWidth: number,
  designHeight: number,
  scaleX: number,
): View {
  const scaleY = designHeight / height
  return { x0: (designWidth - width * scaleX) / 2, y0: 0, scaleX, scaleY }
}

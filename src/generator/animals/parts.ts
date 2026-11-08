/** Potongan wajah yang dipakai banyak hewan. Semua koordinat dalam grid 64×64. */
import { INK } from '../design.ts'
import {
  capsule,
  curve,
  ellipse,
  inkLayer,
  plainPaint,
  symmetric,
  union,
  type Layer,
} from '../raster.ts'

export const AXIS = 32
const LINE = 0.6

export function eyes(cy: number, spacing: number, rx: number, ry: number, color = INK): Layer {
  return inkLayer(symmetric(ellipse(AXIS - spacing, cy, rx, ry), AXIS), color)
}

/** Mulut bentuk "w" khas kucing/anjing di bawah hidung. */
export function smallMouth(cy: number, width = 3): Layer {
  const half = width
  return inkLayer(
    union(
      capsule([AXIS, cy - 2], [AXIS, cy], LINE),
      symmetric(
        curve([AXIS, cy], [AXIS - half * 0.5, cy + 2], [AXIS - half, cy + 0.5], LINE),
        AXIS,
      ),
    ),
    INK,
  )
}

export function whiskers(cy: number, inner: number, outer: number): Layer {
  return inkLayer(
    symmetric(
      union(
        capsule([AXIS - inner, cy - 1], [AXIS - outer, cy - 3], LINE),
        capsule([AXIS - inner, cy + 1], [AXIS - outer, cy + 2], LINE),
      ),
      AXIS,
    ),
    INK,
  )
}

export function blush(cy: number, spacing: number, color = '#ff9fb2'): Layer {
  return plainPaint(symmetric(ellipse(AXIS - spacing, cy, 2.6, 1.6), AXIS), color)
}

/** Garis senyum sederhana. */
export function smile(cy: number, width: number, depth: number): Layer {
  return inkLayer(curve([AXIS - width, cy], [AXIS, cy + depth], [AXIS + width, cy], LINE), INK)
}

export const thinLine = LINE

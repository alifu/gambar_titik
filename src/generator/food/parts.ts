import { darken } from '../color.ts'
import type { Rng } from '../random.ts'
import { pick, range } from '../random.ts'
import { scatter } from '../scatter.ts'
import { capsule, ellipse, paint, union, type Layer, type Shape } from '../raster.ts'

export const SPRINKLE_COLORS = ['#ff6b9a', '#5bc0eb', '#ffd447', '#7bd389', '#ffffff'] as const
/** Taburan meses warna-warni berbentuk kapsul pendek. */
export function sprinkles(rng: Rng, count: number, area: Shape): Layer[] {
  return scatter(rng, count, area, 5).map(([x, y]) => {
    const angle = range(rng, 0, Math.PI)
    const dx = Math.cos(angle) * 1.6
    const dy = Math.sin(angle) * 1.6
    return paint(capsule([x - dx, y - dy], [x + dx, y + dy], 1), pick(rng, SPRINKLE_COLORS))
  })
}

export function shadow(cx: number, cy: number, rx: number, ry: number, surface: string): Layer {
  return paint(ellipse(cx, cy, rx, ry), darken(surface, 0.15))
}

export function steam(x: number, top: number): Shape {
  return union(
    capsule([x, top + 10], [x - 2, top + 6], 0.6),
    capsule([x - 2, top + 6], [x, top + 2], 0.6),
    capsule([x, top + 2], [x - 1, top], 0.6),
  )
}

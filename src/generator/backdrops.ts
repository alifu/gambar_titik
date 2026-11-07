/** Bentuk pelengkap bersama (awan, bintang, piring, bunga). */
import { darken } from './color.ts'
import { WHITE } from './design.ts'
import { circle, ellipse, paint, polygon, union, type Layer, type Shape } from './raster.ts'

export function cloud(cx: number, cy: number, scale: number): Shape {
  return union(
    ellipse(cx, cy + 1 * scale, 7 * scale, 3 * scale),
    circle(cx - 3 * scale, cy - 0.5 * scale, 3 * scale),
    circle(cx + 2 * scale, cy - 1.5 * scale, 3.6 * scale),
  )
}

export function star(cx: number, cy: number, r: number): Shape {
  const points = Array.from({ length: 10 }, (_, index): readonly [number, number] => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5
    const radius = index % 2 === 0 ? r * 1.6 : r * 0.7
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]
  })
  return polygon(points)
}

export function plate(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color = WHITE,
  inner = '#e9f0f6',
): Layer[] {
  return [
    paint(ellipse(cx, cy + 1.5, rx, ry), darken(color, 0.12)),
    paint(ellipse(cx, cy, rx, ry), color),
    paint(ellipse(cx, cy, rx * 0.72, ry * 0.68), inner),
  ]
}

export function flower(cx: number, cy: number, petal: string): Layer[] {
  const petals = union(
    ...Array.from({ length: 5 }, (_, index) => {
      const angle = (index * Math.PI * 2) / 5 - Math.PI / 2
      return circle(cx + Math.cos(angle) * 2.2, cy + Math.sin(angle) * 2.2, 1.9)
    }),
  )
  return [paint(petals, petal), paint(circle(cx, cy, 1.3), '#ffd447')]
}

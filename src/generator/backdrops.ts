/** Latar belakang bersama untuk gambar 64×64 (hewan & makanan). */
import { darken, lighten } from './color.ts'
import { WHITE } from './design.ts'
import type { Rng } from './random.ts'
import { int, range } from './random.ts'
import {
  below,
  circle,
  ellipse,
  fill,
  paint,
  polygon,
  rect,
  union,
  type Layer,
  type Shape,
} from './raster.ts'

const SIZE = 64

export function cloud(cx: number, cy: number, scale: number): Shape {
  return union(
    ellipse(cx, cy + 1 * scale, 7 * scale, 3 * scale),
    circle(cx - 3 * scale, cy - 0.5 * scale, 3 * scale),
    circle(cx + 2 * scale, cy - 1.5 * scale, 3.6 * scale),
  )
}

/** Garis ketinggian bergelombang halus untuk bukit. */
export function hillLine(rng: Rng, base: number, amplitude: number, width = SIZE): number[] {
  const phase = range(rng, 0, Math.PI * 2)
  const frequency = range(rng, 1.2, 2.2)
  return Array.from(
    { length: width },
    (_, x) => base + Math.sin((x / width) * Math.PI * frequency + phase) * amplitude,
  )
}

export function meadow(rng: Rng, sky = '#bfe6ff', grass = '#8fd16a'): Layer[] {
  const sunX = int(rng, 8, 14)
  return [
    fill(sky),
    paint(circle(sunX, 9, 5), '#ffe066'),
    paint(cloud(int(rng, 52, 56), int(rng, 8, 11), 0.8), WHITE),
    paint(below(hillLine(rng, 42, 3)), lighten(grass, 0.25)),
    paint(below(hillLine(rng, 48, 2)), grass),
  ]
}

export function room(wall: string, floor: string): Layer[] {
  return [
    fill(wall),
    paint(rect(6, 6, 22, 24), lighten(wall, 0.55)),
    paint(rect(0, 46, SIZE, SIZE), floor),
    paint(rect(0, 54, SIZE, 55), darken(floor, 0.2)),
  ]
}

export function underwater(rng: Rng): Layer[] {
  const weedX = int(rng, 4, 10)
  return [
    fill('#6fc8f0'),
    paint(rect(0, 0, SIZE, 14), '#a7e1f7'),
    paint(below(hillLine(rng, 56, 2)), '#f2d795'),
    paint(
      polygon([
        [weedX, 58],
        [weedX + 3, 40],
        [weedX + 1, 30],
        [weedX + 6, 42],
        [weedX + 5, 58],
      ]),
      '#4fb06a',
    ),
    paint(
      polygon([
        [56, 58],
        [54, 44],
        [58, 36],
        [61, 46],
        [60, 58],
      ]),
      '#3f9a5c',
    ),
    paint(circle(52, 12, 2.5), '#dff6ff'),
    paint(circle(56, 20, 1.8), '#dff6ff'),
  ]
}

export function nightSky(rng: Rng, sky = '#2b3a67'): Layer[] {
  const moonY = int(rng, 8, 11)
  return [
    fill(sky),
    paint(circle(57, moonY, 5), '#fff4c2'),
    paint(circle(60, moonY - 2, 4), sky),
    paint(star(7, 9, 2), '#ffe680'),
    paint(star(12, 26, 1.6), '#ffe680'),
    paint(star(56, 28, 1.8), '#ffe680'),
  ]
}

export function star(cx: number, cy: number, r: number): Shape {
  const points = Array.from({ length: 10 }, (_, index): readonly [number, number] => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5
    const radius = index % 2 === 0 ? r * 1.6 : r * 0.7
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]
  })
  return polygon(points)
}

export function snowField(rng: Rng): Layer[] {
  return [
    fill('#cfe3f5'),
    paint(circle(10, 10, 1.6), WHITE),
    paint(circle(52, 8, 1.6), WHITE),
    paint(circle(30, 6, 1.6), WHITE),
    paint(below(hillLine(rng, 46, 3)), '#f4f8ff'),
  ]
}

/** Taplak kotak-kotak dengan perspektif datar (meja di bagian bawah). */
export function tablecloth(wall: string, check: string, top = 34): Layer[] {
  const cell = 8
  const checks: Shape = (x, y) =>
    y >= top && (Math.floor(x / cell) + Math.floor((y - top) / cell)) % 2 === 0
  return [fill(wall), paint(rect(0, top, SIZE, SIZE), WHITE), paint(checks, check)]
}

export function woodTable(wall: string, wood = '#d9a066', top = 38): Layer[] {
  return [
    fill(wall),
    paint(rect(0, top, SIZE, SIZE), wood),
    paint(rect(0, top + 9, SIZE, top + 10), darken(wood, 0.2)),
    paint(rect(0, top + 18, SIZE, top + 19), darken(wood, 0.2)),
  ]
}

export function polkaWall(wall: string, dot: string): Layer[] {
  const dots: Shape = (x, y) => {
    const row = Math.floor(y / 12)
    const offset = row % 2 === 0 ? 0 : 6
    const dx = ((x + offset) % 12) - 6
    const dy = (y % 12) - 6
    return dx * dx + dy * dy <= 4
  }
  return [fill(wall), paint(dots, dot)]
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

export function pond(rng: Rng, sky = '#c9ecff'): Layer[] {
  return [
    fill(sky),
    paint(cloud(int(rng, 10, 16), 10, 0.9), WHITE),
    paint(below(hillLine(rng, 30, 2)), '#9ccf6b'),
    paint(rect(0, 36, SIZE, SIZE), '#5fb7d9'),
    paint(rect(4, 41, 14, 42), '#8fd3ea'),
    paint(rect(48, 44, 60, 45), '#8fd3ea'),
  ]
}

export function savanna(rng: Rng, sky = '#ffe2a8'): Layer[] {
  return [
    fill(sky),
    paint(circle(int(rng, 50, 54), 12, 7), '#ffb347'),
    paint(rect(5, 20, 7, 40), '#7a5230'),
    paint(ellipse(6, 20, 7, 3), '#7fa650'),
    paint(below(hillLine(rng, 42, 2)), '#e8c170'),
  ]
}

export function beach(rng: Rng): Layer[] {
  return [
    fill('#bfe9ff'),
    paint(cloud(int(rng, 48, 54), 9, 0.9), WHITE),
    paint(rect(0, 26, SIZE, 40), '#4fb3e0'),
    paint(below(hillLine(rng, 40, 1.5)), '#f6dc9b'),
  ]
}

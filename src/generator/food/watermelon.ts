import { INK, type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import {
  circle,
  curve,
  ellipse,
  inkLayer,
  intersect,
  paint,
  rect,
  sector,
  union,
  type Layer,
  type Point,
  type Shape,
} from '../raster.ts'

const RIND = '#2e7d32'
const PITH = '#d8f5a2'
const FLESH = '#ff4d5e'

function seeds(points: readonly Point[]): Layer {
  return inkLayer(union(...points.map(([x, y]) => ellipse(x, y, 0.9, 1.6))), INK)
}

function half(): Layer[] {
  const below = rect(0, 26, 64, 64)
  return [
    paint(intersect(circle(32, 26, 27), below), RIND),
    paint(intersect(circle(32, 26, 24.5), below), PITH),
    paint(intersect(circle(32, 26, 22.5), below), FLESH),
    paint(rect(5, 24, 59, 27), FLESH),
    seeds([
      [20, 33],
      [32, 36],
      [44, 33],
      [26, 42],
      [38, 42],
      [32, 46],
      [14, 30],
      [50, 30],
    ]),
  ]
}

function wedge(cx: number, apexY: number, spread: number): Layer[] {
  const start = Math.PI / 2 - spread
  const end = Math.PI / 2 + spread
  return [
    paint(sector(cx, apexY, 30, start, end), RIND),
    paint(sector(cx, apexY, 27.5, start, end), PITH),
    paint(sector(cx, apexY, 25.5, start, end), FLESH),
    seeds([
      [cx, apexY + 10],
      [cx - 4, apexY + 17],
      [cx + 4, apexY + 17],
      [cx - 8, apexY + 22],
      [cx, apexY + 22],
      [cx + 8, apexY + 22],
    ]),
  ]
}

function whole(): Layer[] {
  const melon = ellipse(30, 38, 24, 17)
  const stripes: Shape = union(
    ...[-14, -5, 4, 13].map((dx) =>
      curve([30 + dx, 22], [30 + dx * 1.4 + 2, 38], [30 + dx, 54], 1.6),
    ),
  )
  return [
    paint(melon, '#7cb342'),
    paint(intersect(melon, stripes), RIND),
    paint(curve([30, 22], [31, 18], [34, 17], 1), '#7a5230'),
    ...wedge(52, 32, 0.45),
  ]
}

export const watermelon: Subject = {
  key: 'watermelon',
  count: 3,
  create: (_rng: Rng, variant: number): Design => {
    const names = ['Setengah', 'Potong', 'Utuh'] as const
    const fruit = variant === 0 ? half() : variant === 1 ? wedge(32, 22, 0.8) : whole()
    return {
      title: `Semangka ${variantOf(names, variant)}`,
      layers: [...fruit],
    }
  },
}

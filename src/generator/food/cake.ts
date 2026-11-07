import { polkaWall, tablecloth } from '../backdrops.ts'
import { darken, lighten } from '../color.ts'
import { WHITE, type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import {
  capsule,
  circle,
  curve,
  ellipse,
  intersect,
  paint,
  rect,
  union,
  type Layer,
  type Shape,
} from '../raster.ts'
import { sprinkles } from './parts.ts'

interface CakeLook {
  readonly name: string
  readonly sponge: string
  readonly frosting: string
  readonly topper: 'cherry' | 'strawberry' | 'candles'
}

const LOOKS: readonly CakeLook[] = [
  { name: 'Cokelat', sponge: '#8d5a3b', frosting: '#5d3a25', topper: 'cherry' },
  { name: 'Stroberi', sponge: '#fbe3c0', frosting: '#ff9cc2', topper: 'strawberry' },
  { name: 'Ulang Tahun', sponge: '#ffe8a8', frosting: '#ffffff', topper: 'candles' },
]

const BODY = union(rect(12, 30, 52, 52), ellipse(32, 52, 20, 5))
const TOP = ellipse(32, 30, 20, 5)

function frostingShape(): Shape {
  const drips = [16, 22, 29, 36, 43, 48].map((x, index) =>
    capsule([x, 31], [x, 34 + (index % 2) * 3], 2),
  )
  return union(TOP, intersect(union(...drips), rect(12, 0, 52, 64)))
}

function toppers(look: CakeLook): Layer[] {
  if (look.topper === 'cherry') {
    return [
      paint(curve([32, 24], [33, 19], [36, 17], 0.8), '#5d8a3a'),
      paint(circle(32, 25, 3.5), '#d62839'),
    ]
  }
  if (look.topper === 'strawberry') {
    const berries = [20, 32, 44].map((x) => ellipse(x, 28, 3, 3.6))
    return [
      paint(union(...berries), '#e63946'),
      paint(union(...[20, 32, 44].map((x) => ellipse(x, 24.5, 2.4, 1.2))), '#4caf50'),
    ]
  }
  const candles = [22, 32, 42]
  return [
    paint(union(...candles.map((x) => rect(x - 1.5, 17, x + 1.5, 29))), '#5bc0eb'),
    paint(union(...candles.map((x) => ellipse(x, 13, 1.8, 3))), '#ffb703'),
  ]
}

function cakeLayers(rng: Rng, look: CakeLook): Layer[] {
  const cream = intersect(BODY, rect(0, 40, 64, 43))
  const layers: Layer[] = [
    paint(ellipse(32, 54, 26, 6), WHITE),
    paint(ellipse(32, 54, 20, 4), '#e3edf5'),
    paint(BODY, look.sponge),
    paint(cream, lighten(look.frosting, look.frosting === WHITE ? 0 : 0.4)),
    paint(frostingShape(), look.frosting),
  ]
  const extras =
    look.topper === 'candles' ? sprinkles(rng, 6, intersect(BODY, rect(0, 44, 64, 52))) : []
  return [...layers, ...extras, ...toppers(look)]
}

export const cake: Subject = {
  key: 'cake',
  count: 3,
  create: (rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    const backdrop =
      variant === 1
        ? tablecloth('#fff0f5', '#ffc1d6', 44)
        : polkaWall(
            variant === 0 ? '#ffe9c9' : '#e3f0ff',
            darken(variant === 0 ? '#ffe9c9' : '#e3f0ff', 0.08),
          )
    return { title: `Kue ${look.name}`, layers: [...backdrop, ...cakeLayers(rng, look)] }
  },
}

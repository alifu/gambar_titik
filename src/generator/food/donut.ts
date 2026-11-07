import { plate } from '../backdrops.ts'
import { WHITE, type Design, type Subject, variantOf } from '../design.ts'
import { scatter } from '../scatter.ts'
import { sprinkles } from './parts.ts'
import { type Rng } from '../random.ts'
import {
  circle,
  ellipse,
  paint,
  plainPaint,
  polar,
  subtract,
  union,
  type Layer,
} from '../raster.ts'

interface DonutLook {
  readonly name: string
  readonly glaze: string | null
  readonly sprinkles: boolean
}

const LOOKS: readonly DonutLook[] = [
  { name: 'Cokelat', glaze: '#6b3e26', sprinkles: true },
  { name: 'Stroberi', glaze: '#ff8fbf', sprinkles: true },
  { name: 'Gula Halus', glaze: null, sprinkles: false },
]

const CX = 32
const CY = 33

function glazeLayers(rng: Rng, glaze: string, withSprinkles: boolean): Layer[] {
  const hole = circle(CX, CY, 7)
  const shape = subtract(
    polar(CX, CY - 0.5, (angle) => 16.5 + Math.sin(angle * 7) * 1.6 + Math.sin(angle * 3) * 0.8),
    circle(CX, CY, 9.5),
  )
  const ring = subtract(circle(CX, CY, 14.5), circle(CX, CY, 11))
  return [
    paint(shape, glaze),
    paint(subtract(ellipse(CX - 7, CY - 10, 4, 1.8, -0.5), hole), WHITE),
    ...(withSprinkles ? sprinkles(rng, 10, ring) : []),
  ]
}

function sugar(rng: Rng): Layer {
  const dough = subtract(circle(CX, CY, 18), circle(CX, CY, 9))
  return plainPaint(union(...scatter(rng, 10, dough, 7).map(([x, y]) => circle(x, y, 1.9))), WHITE)
}

function donutLayers(rng: Rng, look: DonutLook): Layer[] {
  const dough = paint(subtract(circle(CX, CY, 20), circle(CX, CY, 7)), '#e0a052')
  return look.glaze === null
    ? [dough, sugar(rng)]
    : [dough, ...glazeLayers(rng, look.glaze, look.sprinkles)]
}

export const donut: Subject = {
  key: 'donut',
  count: 3,
  create: (rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    return {
      title: `Donat ${look.name}`,
      layers: [...plate(CX, CY + 6, 29, 20), ...donutLayers(rng, look)],
    }
  },
}

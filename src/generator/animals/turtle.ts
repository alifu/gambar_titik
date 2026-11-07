import { beach, meadow, underwater } from '../backdrops.ts'
import { darken, lighten } from '../color.ts'
import { INK, type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import {
  circle,
  curve,
  ellipse,
  inkLayer,
  intersect,
  paint,
  polygon,
  rect,
  roundRect,
  type Layer,
  type Shape,
} from '../raster.ts'
import { thinLine } from './parts.ts'

interface TurtleLook {
  readonly name: string
  readonly shell: string
  readonly skin: string
  readonly flippers: boolean
}

const LOOKS: readonly TurtleLook[] = [
  { name: 'Hijau', shell: '#6fae3f', skin: '#a8d672', flippers: false },
  { name: 'Laut', shell: '#2f9e8f', skin: '#9ad9c4', flippers: true },
  { name: 'Darat', shell: '#b57a3c', skin: '#d8c08a', flippers: false },
]

function backdrop(rng: Rng, variant: number): Layer[] {
  if (variant === 0) return meadow(rng)
  if (variant === 1) return underwater(rng)
  return beach(rng)
}

function hexagon(cx: number, cy: number, r: number): Shape {
  return polygon(
    Array.from({ length: 6 }, (_, index): readonly [number, number] => {
      const angle = (index * Math.PI) / 3
      return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.8]
    }),
  )
}

function limbs(look: TurtleLook): Layer[] {
  if (look.flippers) {
    return [
      paint(ellipse(22, 46, 8, 3, 0.6), look.skin),
      paint(ellipse(46, 46, 7, 2.8, -0.6), look.skin),
      paint(ellipse(18, 34, 9, 3, -0.6), darken(look.skin, 0.1)),
    ]
  }
  return [
    paint(roundRect(18, 40, 25, 50, 2.5), look.skin),
    paint(roundRect(41, 40, 48, 50, 2.5), look.skin),
    paint(
      polygon([
        [52, 40],
        [59, 43],
        [52, 45],
      ]),
      look.skin,
    ),
  ]
}

function shell(look: TurtleLook): Layer[] {
  const dome = intersect(ellipse(34, 41, 19, 17), rect(0, 0, 64, 41))
  const plate = lighten(look.shell, 0.3)
  return [
    paint(dome, look.shell),
    paint(intersect(dome, hexagon(34, 32, 6)), plate),
    paint(intersect(dome, hexagon(22, 36, 4.6)), plate),
    paint(intersect(dome, hexagon(46, 36, 4.6)), plate),
    paint(roundRect(14, 39, 54, 44, 2), darken(look.shell, 0.2)),
  ]
}

function headLayers(look: TurtleLook): Layer[] {
  return [
    paint(ellipse(15, 38, 5, 3.5, -0.4), look.skin),
    paint(circle(10, 33, 6), look.skin),
    inkLayer(circle(8.5, 31.5, 1.5), INK),
    inkLayer(curve([5, 35], [7, 36.8], [9.5, 35.5], thinLine), INK),
    paint(ellipse(11, 35.5, 1.8, 1.1), '#ff9fb2'),
  ]
}

export const turtle: Subject = {
  key: 'turtle',
  count: 3,
  create: (rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    return {
      title: `Kura-kura ${look.name}`,
      layers: [...backdrop(rng, variant), ...limbs(look), ...shell(look), ...headLayers(look)],
    }
  },
}

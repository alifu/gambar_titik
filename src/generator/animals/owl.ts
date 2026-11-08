import { darken, lighten } from '../color.ts'
import { INK, WHITE, type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import {
  capsule,
  circle,
  curve,
  ellipse,
  inkLayer,
  paint,
  polygon,
  symmetric,
  union,
  type Layer,
} from '../raster.ts'
import { AXIS, thinLine } from './parts.ts'

interface OwlLook {
  readonly name: string
  readonly feather: string
  readonly iris: string
}

const LOOKS: readonly OwlLook[] = [
  { name: 'Cokelat', feather: '#9c6b3f', iris: '#ffc83d' },
  { name: 'Abu-abu', feather: '#8d8f9e', iris: '#ff9f1c' },
  { name: 'Salju', feather: '#eef0f5', iris: '#ffd447' },
]

function bodyLayers(look: OwlLook): Layer[] {
  const belly = lighten(look.feather, 0.5)
  const marks = union(
    ...[26, 32, 38].map((x) => curve([x - 2, 42], [x, 44], [x + 2, 42], thinLine)),
    ...[29, 35].map((x) => curve([x - 2, 48], [x, 50], [x + 2, 48], thinLine)),
  )
  return [
    paint(capsule([0, 57], [64, 55], 3), '#7a5230'),
    paint(
      symmetric(
        polygon([
          [17, 24],
          [16, 9],
          [26, 18],
        ]),
        AXIS,
      ),
      darken(look.feather, 0.2),
    ),
    paint(ellipse(AXIS, 36, 16, 19), look.feather),
    paint(symmetric(ellipse(17.5, 40, 5, 12, 0.15), AXIS), darken(look.feather, 0.2)),
    paint(ellipse(AXIS, 45, 10, 9), belly),
    inkLayer(marks, darken(look.feather, 0.3)),
    paint(symmetric(ellipse(27, 55, 3, 2), AXIS), '#ff9f1c'),
  ]
}

function faceLayers(look: OwlLook): Layer[] {
  return [
    paint(symmetric(circle(25, 28, 7.5), AXIS), lighten(look.feather, 0.65)),
    paint(symmetric(circle(25, 28, 5), AXIS), WHITE),
    paint(symmetric(circle(25, 28, 3.4), AXIS), look.iris),
    inkLayer(symmetric(circle(25, 28, 1.7), AXIS), INK),
    paint(
      polygon([
        [29.5, 33],
        [34.5, 33],
        [AXIS, 38],
      ]),
      '#ff9f1c',
    ),
  ]
}

export const owl: Subject = {
  key: 'owl',
  count: 3,
  create: (_rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    return {
      title: `Burung Hantu ${look.name}`,
      layers: [...bodyLayers(look), ...faceLayers(look)],
    }
  },
}

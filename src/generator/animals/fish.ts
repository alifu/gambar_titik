import { underwater } from '../backdrops.ts'
import { darken, lighten } from '../color.ts'
import { INK, WHITE, type Design, type Subject, variantOf } from '../design.ts'
import { int, type Rng } from '../random.ts'
import {
  circle,
  curve,
  ellipse,
  inkLayer,
  intersect,
  paint,
  polygon,
  type Layer,
  type Point,
  type Shape,
} from '../raster.ts'
import { thinLine } from './parts.ts'

interface FishLook {
  readonly name: string
  readonly body: string
  readonly fin: string
  readonly band: string | null
  readonly longTail: boolean
}

const LOOKS: readonly FishLook[] = [
  { name: 'Badut', body: '#ff8a2a', fin: '#ff6a00', band: WHITE, longTail: false },
  { name: 'Biru', body: '#3a7bd5', fin: '#ffd23f', band: null, longTail: false },
  { name: 'Mas', body: '#ffb02e', fin: '#ffd88a', band: null, longTail: true },
]

const BODY = ellipse(28, 32, 17, 12)

function tail(look: FishLook): Shape {
  const points: readonly Point[] = look.longTail
    ? [
        [40, 32],
        [60, 14],
        [56, 30],
        [62, 50],
      ]
    : [
        [41, 32],
        [57, 20],
        [53, 32],
        [57, 44],
      ]
  return polygon(points)
}

function fins(look: FishLook): Layer[] {
  return [
    paint(tail(look), look.fin),
    paint(
      polygon([
        [17, 23],
        [28, 12],
        [40, 24],
      ]),
      look.fin,
    ),
    paint(
      polygon([
        [23, 41],
        [29, 50],
        [35, 41],
      ]),
      look.fin,
    ),
  ]
}

function bands(look: FishLook): Layer[] {
  if (look.band === null) {
    return [paint(intersect(BODY, ellipse(34, 29, 7, 4, 0.2)), darken(look.body, 0.35))]
  }
  return [
    paint(intersect(BODY, ellipse(22, 32, 3, 14, 0.1)), look.band),
    paint(intersect(BODY, ellipse(35, 32, 2.6, 14, -0.1)), look.band),
  ]
}

function face(): Layer[] {
  return [
    paint(circle(18, 28, 4), WHITE),
    inkLayer(circle(17.2, 28.3, 2), INK),
    inkLayer(curve([12.5, 35], [14.5, 36.5], [16.5, 35], thinLine), INK),
    inkLayer(curve([25, 23], [22, 32], [25, 41], thinLine), INK),
  ]
}

export const fish: Subject = {
  key: 'fish',
  count: 3,
  create: (rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    const bubbleX = int(rng, 6, 9)
    return {
      title: `Ikan ${look.name}`,
      layers: [
        ...underwater(rng),
        ...fins(look),
        paint(BODY, look.body),
        ...bands(look),
        paint(ellipse(31, 37, 4.5, 2.6, 0.5), lighten(look.fin, 0.2)),
        ...face(),
        paint(circle(bubbleX, 24, 2), '#dff6ff'),
        paint(circle(bubbleX - 2, 16, 2.6), '#dff6ff'),
      ],
    }
  },
}

import { meadow, snowField } from '../backdrops.ts'
import { darken, lighten } from '../color.ts'
import { INK, WHITE, type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import {
  capsule,
  circle,
  ellipse,
  fill,
  inkLayer,
  paint,
  rect,
  roundRect,
  symmetric,
  union,
  type Layer,
} from '../raster.ts'
import { AXIS, blush, eyes, smallMouth } from './parts.ts'

interface BearLook {
  readonly name: string
  readonly fur: string
  readonly limbs: string
  readonly light: string
  readonly panda: boolean
}

const LOOKS: readonly BearLook[] = [
  { name: 'Cokelat', fur: '#a86b3c', limbs: '#a86b3c', light: '#e8c49a', panda: false },
  { name: 'Panda', fur: '#f7f7f7', limbs: '#34313d', light: '#f7f7f7', panda: true },
  { name: 'Kutub', fur: '#f2f6fb', limbs: '#f2f6fb', light: '#dde6f2', panda: false },
]

function bamboo(): Layer[] {
  const stalks = union(rect(6, 0, 11, 64), rect(50, 0, 55, 64))
  const joints = union(
    rect(5, 14, 12, 16),
    rect(5, 36, 12, 38),
    rect(49, 24, 56, 26),
    rect(49, 46, 56, 48),
  )
  return [
    fill('#dff3d0'),
    paint(stalks, '#7cbf4a'),
    paint(joints, '#4f8f2f'),
    paint(ellipse(16, 20, 6, 2, -0.4), '#5cae4a'),
    paint(rect(0, 50, 64, 64), '#9ccf6b'),
  ]
}

function backdrop(rng: Rng, variant: number): Layer[] {
  if (variant === 0) return meadow(rng)
  if (variant === 1) return bamboo()
  return snowField(rng)
}

function honeyPot(): Layer[] {
  return [
    paint(roundRect(45, 48, 59, 61, 4), '#e0a042'),
    paint(roundRect(44, 46, 60, 49, 1.5), '#c9822c'),
    paint(capsule([47, 50], [47, 55], 1.5), '#ffd447'),
  ]
}

function bodyLayers(look: BearLook): Layer[] {
  return [
    paint(ellipse(AXIS, 49, 14, 12), look.fur),
    paint(ellipse(AXIS, 51, 8, 8), lighten(look.light, 0.3)),
    paint(symmetric(ellipse(19, 46, 4.5, 7.5, 0.45), AXIS), look.limbs),
    paint(symmetric(ellipse(24, 59.5, 5.5, 3.5), AXIS), look.limbs),
    paint(symmetric(ellipse(24, 59.5, 2.6, 1.8), AXIS), look.panda ? '#5a5566' : look.light),
  ]
}

function headLayers(look: BearLook): Layer[] {
  const patches: Layer[] = look.panda
    ? [paint(symmetric(ellipse(25.5, 24, 4, 5, 0.6), AXIS), look.limbs)]
    : []
  return [
    paint(symmetric(circle(20, 15, 5.5), AXIS), look.limbs),
    paint(symmetric(circle(20, 15, 3), AXIS), look.panda ? '#5a5566' : look.light),
    paint(circle(AXIS, 26, 13.5), look.fur),
    ...patches,
    paint(ellipse(AXIS, 31.5, 6.5, 5), look.panda ? WHITE : look.light),
    look.panda ? eyes(24, 6, 1.4, 1.8, WHITE) : eyes(24, 6, 1.8, 2.2),
    inkLayer(ellipse(AXIS, 29.5, 2.6, 1.8), INK),
    smallMouth(33.5, 2.5),
    blush(30, 10, look.panda ? '#ffc2d1' : darken('#ff9fb2', 0.05)),
  ]
}

export const bear: Subject = {
  key: 'bear',
  count: 3,
  create: (rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    return {
      title: `Beruang ${look.name}`,
      layers: [
        ...backdrop(rng, variant),
        ...bodyLayers(look),
        ...headLayers(look),
        ...(variant === 0 ? honeyPot() : []),
      ],
    }
  },
}

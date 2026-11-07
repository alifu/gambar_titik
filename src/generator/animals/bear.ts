import { darken, lighten } from '../color.ts'
import { INK, WHITE, type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import {
  capsule,
  circle,
  ellipse,
  inkLayer,
  paint,
  roundRect,
  symmetric,
  union,
  type Layer,
} from '../raster.ts'
import { AXIS, blush, eyes } from './parts.ts'

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
  { name: 'Kutub', fur: '#f4f8fc', limbs: '#f4f8fc', light: '#cddcec', panda: false },
]

function honeyPot(): Layer[] {
  return [
    paint(roundRect(45, 48, 59, 61, 4), '#e0a042'),
    paint(roundRect(44, 46, 60, 49, 1.5), '#c9822c'),
    paint(capsule([47, 50], [47, 55], 1.5), '#ffd447'),
  ]
}

function bamboo(): Layer[] {
  return [
    paint(capsule([50, 62], [56, 20], 2.4), '#7cbf4a'),
    paint(
      union(capsule([49.5, 47], [54.5, 47.6], 2.6), capsule([52, 32], [57, 32.6], 2.6)),
      '#4f8f2f',
    ),
    paint(ellipse(61, 24, 5, 2.2, -0.5), '#5cae4a'),
  ]
}

function scarf(): Layer[] {
  return [
    paint(capsule([21, 39], [43, 39], 2.6), '#e8463c'),
    paint(roundRect(36, 39, 41, 49, 1.5), '#e8463c'),
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
    ? [inkLayer(symmetric(ellipse(25, 24.5, 4.6, 5.6, 0.6), AXIS), INK)]
    : []
  return [
    paint(symmetric(circle(20, 15, 5.5), AXIS), look.limbs),
    paint(symmetric(circle(20, 15, 3), AXIS), look.panda ? '#5a5566' : look.light),
    paint(circle(AXIS, 26, 13.5), look.fur),
    ...patches,
    paint(ellipse(AXIS, 32, 7.5, 5.5), look.panda ? WHITE : look.light),
    look.panda ? eyes(23.5, 6.5, 1.9, 1.9, WHITE) : eyes(22, 7, 2, 2.4),
    inkLayer(ellipse(AXIS, 30, 3, 2), INK),
    inkLayer(capsule([AXIS, 31], [AXIS, 34.5], 0.8), INK),
    blush(31, 10.5, look.panda ? '#ffc2d1' : darken('#ff9fb2', 0.05)),
  ]
}

function extras(variant: number): Layer[] {
  if (variant === 0) return honeyPot()
  return variant === 1 ? bamboo() : scarf()
}

export const bear: Subject = {
  key: 'bear',
  count: 3,
  create: (_rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    return {
      title: `Beruang ${look.name}`,
      layers: [...bodyLayers(look), ...headLayers(look), ...extras(variant)],
    }
  },
}

import { flower, meadow, polkaWall, savanna } from '../backdrops.ts'
import { darken, lighten } from '../color.ts'
import { type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import {
  circle,
  curve,
  ellipse,
  intersect,
  paint,
  polygon,
  rect,
  roundRect,
  symmetric,
  type Layer,
} from '../raster.ts'
import { AXIS, blush, eyes } from './parts.ts'

interface ElephantLook {
  readonly name: string
  readonly skin: string
}

const LOOKS: readonly ElephantLook[] = [
  { name: 'Abu-abu', skin: '#a7b0c0' },
  { name: 'Biru', skin: '#8fbce6' },
  { name: 'Merah Muda', skin: '#f4b6c8' },
]

function backdrop(rng: Rng, variant: number): Layer[] {
  if (variant === 0) return savanna(rng)
  if (variant === 1) return polkaWall('#fff4d6', '#ffe08a')
  return meadow(rng)
}

function bodyLayers(look: ElephantLook): Layer[] {
  const legs = symmetric(roundRect(19, 48, 28, 62, 2.5), AXIS)
  const bodyColor = darken(look.skin, 0.12)
  return [
    paint(ellipse(AXIS, 47, 16, 11), bodyColor),
    paint(legs, bodyColor),
    paint(
      symmetric(intersect(ellipse(23.5, 62, 3.5, 2.5), rect(0, 0, 64, 62)), AXIS),
      lighten(look.skin, 0.6),
    ),
  ]
}

function headLayers(look: ElephantLook): Layer[] {
  return [
    paint(symmetric(ellipse(14, 27, 11, 13), AXIS), look.skin),
    paint(symmetric(ellipse(14.5, 27, 7, 9), AXIS), '#f6c6d3'),
    paint(ellipse(AXIS, 25, 13, 12.5), look.skin),
    paint(curve([AXIS, 30], [AXIS - 1, 47], [40, 46], 3.2), look.skin),
    paint(curve([39, 46.5], [44, 46], [44.5, 40], 2.3), look.skin),
    eyes(23, 6, 1.7, 2.2),
    blush(29, 9.5),
  ]
}

function partyHat(): Layer[] {
  const cone = polygon([
    [26, 14],
    [AXIS, 0],
    [38, 14],
  ])
  return [
    paint(cone, '#ff6b9a'),
    paint(intersect(cone, rect(0, 6, 64, 9)), '#ffd447'),
    paint(circle(AXIS, 1.5, 2.2), '#5bc0eb'),
  ]
}

export const elephant: Subject = {
  key: 'elephant',
  count: 3,
  create: (rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    const extras = variant === 1 ? partyHat() : variant === 2 ? flower(19, 17, '#ff7aa2') : []
    return {
      title: `Gajah ${look.name}`,
      layers: [...backdrop(rng, variant), ...bodyLayers(look), ...headLayers(look), ...extras],
    }
  },
}

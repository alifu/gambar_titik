import { meadow, polkaWall, room } from '../backdrops.ts'
import { lighten } from '../color.ts'
import { INK, WHITE, type Design, type Subject, variantOf } from '../design.ts'
import { chance, type Rng } from '../random.ts'
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
import { AXIS, blush, eyes, smallMouth } from './parts.ts'

interface DogLook {
  readonly name: string
  readonly fur: string
  readonly ear: string
  readonly light: string
  readonly patch: boolean
}

const LOOKS: readonly DogLook[] = [
  { name: 'Cokelat', fur: '#c68642', ear: '#8a5a2b', light: '#f6e2c4', patch: false },
  { name: 'Putih Belang', fur: '#fbf7f0', ear: '#b07a4a', light: '#fbf7f0', patch: true },
  { name: 'Krem', fur: '#f1c27d', ear: '#d48f45', light: '#fff3dc', patch: false },
]

function backdrop(rng: Rng, variant: number): Layer[] {
  if (variant === 0) return meadow(rng)
  if (variant === 1) return room('#d8f0e4', '#b7825a')
  return polkaWall('#ffe6ee', '#ffc9d9')
}

function body(look: DogLook): Layer[] {
  return [
    paint(curve([42, 54], [54, 52], [54, 40], 2.6), look.fur),
    paint(ellipse(AXIS, 48, 12.5, 11), look.fur),
    paint(ellipse(AXIS, 50, 6.5, 7.5), look.light),
    paint(symmetric(ellipse(26, 58.5, 4.5, 3), AXIS), lighten(look.light, 0.4)),
  ]
}

function head(look: DogLook): Layer[] {
  const layers: Layer[] = [
    paint(ellipse(AXIS, 26, 13.5, 12), look.fur),
    paint(symmetric(ellipse(18.5, 27, 4.8, 10, 0.25), AXIS), look.ear),
  ]
  if (look.patch) layers.push(paint(ellipse(38.5, 22, 5.5, 5), look.ear))
  return [
    ...layers,
    paint(ellipse(AXIS, 33, 8.5, 6), look.light),
    paint(ellipse(AXIS, 38.5, 2.6, 3), '#ff8fa3'),
    eyes(24, 6.5, 2, 2.4),
    inkLayer(ellipse(AXIS, 30, 3, 2), INK),
    smallMouth(35, 3.5),
    blush(31, 10.5),
  ]
}

function bandana(variant: number): Layer {
  const color = variantOf(['#e8463c', '#4b7bec', '#20bf6b'], variant)
  return paint(
    polygon([
      [21, 38],
      [43, 38],
      [AXIS, 47],
    ]),
    color,
  )
}

function bone(): Layer {
  const ends = union(
    circle(44, 58, 1.8),
    circle(44, 61, 1.8),
    circle(56, 58, 1.8),
    circle(56, 61, 1.8),
  )
  return paint(union(ends, capsule([44, 59.5], [56, 59.5], 1.6)), WHITE)
}

export const dog: Subject = {
  key: 'dog',
  count: 3,
  create: (rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    return {
      title: `Anjing ${look.name}`,
      layers: [
        ...backdrop(rng, variant),
        ...(variant === 1 || chance(rng, 0.5) ? [bone()] : []),
        ...body(look),
        bandana(variant),
        ...head(look),
      ],
    }
  },
}

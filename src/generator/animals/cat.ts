import { darken, lighten } from '../color.ts'
import { INK, type Design, type Subject, variantOf } from '../design.ts'
import { int, type Rng } from '../random.ts'
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
import { AXIS, blush, eyes, smallMouth, whiskers } from './parts.ts'

interface CatLook {
  readonly name: string
  readonly fur: string
  readonly light: string
  readonly eye: string
  readonly stripes: boolean
}

const LOOKS: readonly CatLook[] = [
  { name: 'Oranye', fur: '#f5a142', light: '#fff1dc', eye: INK, stripes: true },
  { name: 'Abu-abu', fur: '#a3a9b8', light: '#f1f2f6', eye: INK, stripes: true },
  { name: 'Hitam', fur: '#3d3a4a', light: '#f4f0ea', eye: '#c9e65a', stripes: false },
]

function body(look: CatLook): Layer[] {
  return [
    paint(curve([42, 56], [60, 54], [55, 34], 3), look.fur),
    paint(ellipse(AXIS, 47, 13, 12), look.fur),
    paint(ellipse(AXIS, 50, 7, 8), look.light),
    paint(symmetric(ellipse(26, 58, 4.5, 3), AXIS), lighten(look.fur, 0.6)),
  ]
}

function head(look: CatLook): Layer[] {
  const ear = polygon([
    [17, 25],
    [18, 7],
    [30, 16],
  ])
  const innerEar = polygon([
    [20, 20],
    [20.5, 11.5],
    [27, 16.5],
  ])
  return [
    paint(symmetric(ear, AXIS), look.fur),
    paint(symmetric(innerEar, AXIS), '#ffb3c1'),
    paint(ellipse(AXIS, 27, 15.5, 12.5), look.fur),
    paint(ellipse(AXIS, 33, 7.5, 4.8), look.light),
  ]
}

function stripes(look: CatLook): Layer[] {
  if (!look.stripes) return []
  const color = darken(look.fur, 0.25)
  return [
    paint(
      union(
        capsule([AXIS, 16], [AXIS, 20], 1.2),
        symmetric(capsule([27, 16.5], [28, 20], 1.1), AXIS),
      ),
      color,
    ),
  ]
}

function face(look: CatLook): Layer[] {
  const eyeLayers: Layer[] =
    look.eye === INK
      ? [eyes(26, 7, 2.2, 3)]
      : [eyes(26, 7, 2.8, 3.2, look.eye), eyes(26, 7, 0.9, 2.6)]
  return [
    ...eyeLayers,
    blush(31, 11),
    inkLayer(
      polygon([
        [30, 29.5],
        [34, 29.5],
        [32, 31.6],
      ]),
      '#e8798d',
    ),
    smallMouth(33.5),
    whiskers(32, 9, 20),
  ]
}

function collar(variant: number): Layer[] {
  const color = variantOf(['#e8463c', '#5b8def', '#ff7eb6'], variant)
  return [
    paint(curve([22, 37.5], [AXIS, 42.5], [42, 37.5], 1.6), color),
    paint(circle(AXIS, 43, 2.4), '#ffd447'),
  ]
}

export const cat: Subject = {
  key: 'cat',
  count: 3,
  create: (rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    const withCollar = variant !== 1 || int(rng, 0, 1) === 1
    return {
      title: `Kucing ${look.name}`,
      layers: [
        ...body(look),
        ...head(look),
        ...stripes(look),
        ...face(look),
        ...(withCollar ? collar(variant) : []),
      ],
    }
  },
}

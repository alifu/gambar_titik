import { flower, meadow, snowField } from '../backdrops.ts'
import { lighten } from '../color.ts'
import { type Design, type Subject, variantOf } from '../design.ts'
import { int, type Rng } from '../random.ts'
import { ellipse, inkLayer, paint, polygon, symmetric, type Layer } from '../raster.ts'
import { AXIS, blush, eyes, smallMouth } from './parts.ts'

interface RabbitLook {
  readonly name: string
  readonly fur: string
  readonly inner: string
}

const LOOKS: readonly RabbitLook[] = [
  { name: 'Putih', fur: '#f7f7f7', inner: '#ffb3c6' },
  { name: 'Cokelat', fur: '#c49a6c', inner: '#f2b8a2' },
  { name: 'Abu-abu', fur: '#b7b7c4', inner: '#ffc2d1' },
]

function backdrop(rng: Rng, variant: number): Layer[] {
  if (variant === 2) return snowField(rng)
  return [...meadow(rng), ...flower(int(rng, 6, 10), 56, '#ff7aa2'), ...flower(56, 58, '#b48cff')]
}

function carrot(): Layer[] {
  return [
    paint(ellipse(48, 47, 2, 4, -0.5), '#5cae4a'),
    paint(ellipse(51, 48, 1.8, 3.6, 0.4), '#5cae4a'),
    paint(
      polygon([
        [44, 50],
        [53, 50],
        [47, 62],
      ]),
      '#ff8a2a',
    ),
  ]
}

function rabbitLayers(look: RabbitLook): Layer[] {
  const light = lighten(look.fur, 0.6)
  return [
    paint(symmetric(ellipse(25.5, 14, 4.5, 12, -0.12), AXIS), look.fur),
    paint(symmetric(ellipse(25.5, 15, 2.2, 8.5, -0.12), AXIS), look.inner),
    paint(ellipse(AXIS, 49, 12, 11), look.fur),
    paint(ellipse(AXIS, 51, 7, 7.5), light),
    paint(symmetric(ellipse(24.5, 59, 5, 3), AXIS), light),
    paint(ellipse(AXIS, 30, 13, 11), look.fur),
    paint(symmetric(ellipse(29, 35, 3.6, 3), AXIS), light),
    eyes(28.5, 5.5, 1.8, 2.4),
    blush(32.5, 9),
    inkLayer(
      polygon([
        [30.5, 31.5],
        [33.5, 31.5],
        [32, 33.2],
      ]),
      '#e8798d',
    ),
    smallMouth(35, 2.5),
  ]
}

export const rabbit: Subject = {
  key: 'rabbit',
  count: 3,
  create: (rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    return {
      title: `Kelinci ${look.name}`,
      layers: [
        ...backdrop(rng, variant),
        ...rabbitLayers(look),
        ...(variant === 1 ? [] : carrot()),
      ],
    }
  },
}

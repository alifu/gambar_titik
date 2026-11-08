import { darken, lighten } from '../color.ts'
import { INK, WHITE, type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import {
  circle,
  ellipse,
  inkLayer,
  paint,
  polygon,
  subtract,
  symmetric,
  type Layer,
} from '../raster.ts'
import { AXIS, blush, smile } from './parts.ts'

interface FrogLook {
  readonly name: string
  readonly skin: string
  readonly crown: boolean
}

const LOOKS: readonly FrogLook[] = [
  { name: 'Hijau', skin: '#6cc04a', crown: false },
  { name: 'Raja', skin: '#4fae5a', crown: true },
  { name: 'Oranye', skin: '#ff9a3c', crown: false },
]

function lilyPad(): Layer[] {
  const pad = subtract(
    ellipse(AXIS, 55, 27, 7.5),
    polygon([
      [AXIS, 55],
      [40, 64],
      [46, 64],
    ]),
  )
  return [paint(pad, '#3f9a4a'), paint(ellipse(10, 46, 5, 1.8), '#3f9a4a')]
}

function frogLayers(look: FrogLook): Layer[] {
  const dark = darken(look.skin, 0.2)
  return [
    paint(symmetric(ellipse(18, 50, 8, 5, -0.3), AXIS), dark),
    paint(ellipse(AXIS, 45, 14, 10.5), look.skin),
    paint(ellipse(AXIS, 48, 8.5, 6.5), lighten(look.skin, 0.55)),
    paint(symmetric(ellipse(24, 55, 4.5, 2.6), AXIS), dark),
    ...(look.crown ? [crown()] : []),
    paint(symmetric(circle(23, 23, 6.5), AXIS), look.skin),
    paint(ellipse(AXIS, 31, 16.5, 10), look.skin),
    paint(symmetric(circle(23, 22.5, 4.3), AXIS), WHITE),
    inkLayer(symmetric(circle(23, 23, 2.2), AXIS), INK),
    smile(34, 9, 5),
    blush(35, 11.5),
  ]
}

function crown(): Layer {
  return paint(
    polygon([
      [26, 18],
      [26, 10],
      [29, 14],
      [AXIS, 8],
      [35, 14],
      [38, 10],
      [38, 18],
    ]),
    '#ffd447',
  )
}

export const frog: Subject = {
  key: 'frog',
  count: 3,
  create: (_rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    return {
      title: `Katak ${look.name}`,
      layers: [...lilyPad(), ...frogLayers(look)],
    }
  },
}

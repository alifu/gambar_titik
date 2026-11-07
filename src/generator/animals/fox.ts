import { meadow, nightSky, snowField } from '../backdrops.ts'
import { INK, WHITE, type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import {
  circle,
  ellipse,
  inkLayer,
  paint,
  polygon,
  roundRect,
  symmetric,
  union,
  type Layer,
} from '../raster.ts'
import { AXIS, eyes } from './parts.ts'

interface FoxLook {
  readonly name: string
  readonly fur: string
  readonly light: string
  readonly dark: string
}

const LOOKS: readonly FoxLook[] = [
  { name: 'Oranye', fur: '#f08a24', light: WHITE, dark: '#5a3825' },
  { name: 'Kutub', fur: '#eef2f7', light: '#c9d6e6', dark: '#8c9bb0' },
  { name: 'Merah', fur: '#d9541e', light: '#fff3e6', dark: '#3d2a22' },
]

function backdrop(rng: Rng, variant: number): Layer[] {
  if (variant === 0) return meadow(rng, '#ffe9c7', '#b5c95a')
  if (variant === 1) return snowField(rng)
  return nightSky(rng, '#24305e')
}

function tailAndBody(look: FoxLook): Layer[] {
  return [
    paint(ellipse(47, 49, 8, 13, 0.75), look.fur),
    paint(ellipse(55.5, 41, 4, 5, 0.75), look.light),
    paint(ellipse(AXIS, 48, 11, 11), look.fur),
    paint(
      polygon([
        [26, 40],
        [38, 40],
        [AXIS, 55],
      ]),
      look.light,
    ),
    paint(symmetric(roundRect(24.5, 52, 30.5, 61, 2.5), AXIS), look.dark),
  ]
}

function headLayers(look: FoxLook): Layer[] {
  const ear = polygon([
    [15, 22],
    [17, 4],
    [29, 15],
  ])
  const earTip = polygon([
    [17.5, 17],
    [18, 7.5],
    [25.5, 14],
  ])
  const headShape = union(
    ellipse(AXIS, 24, 15, 10),
    polygon([
      [17, 25],
      [AXIS, 42],
      [47, 25],
    ]),
  )
  const cheeks = polygon([
    [17.5, 27],
    [AXIS, 42.5],
    [AXIS, 33],
    [24, 28],
  ])
  return [
    paint(symmetric(ear, AXIS), look.fur),
    paint(symmetric(earTip, AXIS), look.dark),
    paint(headShape, look.fur),
    paint(symmetric(cheeks, AXIS), look.light),
    eyes(25, 7, 1.8, 2.6),
    inkLayer(circle(AXIS, 39.5, 1.9), INK),
  ]
}

export const fox: Subject = {
  key: 'fox',
  count: 3,
  create: (rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    return {
      title: `Rubah ${look.name}`,
      layers: [...backdrop(rng, variant), ...tailAndBody(look), ...headLayers(look)],
    }
  },
}

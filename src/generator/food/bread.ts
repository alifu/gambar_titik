import { darken, lighten } from '../color.ts'
import { type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import { circle, ellipse, paint, roundRect, union, type Layer } from '../raster.ts'

const CRUST = '#c97b38'
const CRUMB = '#fbe7c2'

function loaf(): Layer[] {
  const loafShape = union(roundRect(8, 26, 44, 52, 4), ellipse(26, 27, 18, 9))
  const slice = union(roundRect(34, 30, 58, 56, 2), circle(39.5, 31, 6), circle(52.5, 31, 6))
  const inner = union(roundRect(36, 32, 56, 54, 1.5), circle(39.5, 32, 4.2), circle(52.5, 32, 4.2))
  return [
    paint(loafShape, CRUST),
    paint(ellipse(26, 25, 14, 5), lighten(CRUST, 0.25)),
    paint(slice, darken(CRUST, 0.05)),
    paint(inner, CRUMB),
  ]
}

function baguette(): Layer[] {
  const angle = -0.4
  const slashes = [-12, -4, 4, 12].map((offset) =>
    ellipse(32 + Math.cos(angle) * offset, 36 + Math.sin(angle) * offset, 3.4, 1.6, angle + 1.1),
  )
  return [
    paint(ellipse(32, 36, 27, 8, angle), CRUST),
    paint(union(...slashes), lighten(CRUST, 0.45)),
  ]
}

function croissant(): Layer[] {
  const sizes = [
    { degrees: -165, along: 5, across: 6.5 },
    { degrees: -15, along: 5, across: 6.5 },
    { degrees: -130, along: 7, across: 9 },
    { degrees: -50, along: 7, across: 9 },
    { degrees: -90, along: 8.5, across: 12 },
  ]
  return sizes.map(({ degrees, along, across }, index) => {
    const angle = (degrees * Math.PI) / 180
    const shape = ellipse(
      32 + Math.cos(angle) * 17,
      50 + Math.sin(angle) * 17,
      along,
      across,
      angle,
    )
    return paint(shape, index === 2 || index === 3 ? '#c2702c' : '#f5bd62')
  })
}

export const bread: Subject = {
  key: 'bread',
  count: 3,
  create: (_rng: Rng, variant: number): Design => {
    const names = ['Roti Tawar', 'Roti Baguette', 'Roti Croissant'] as const
    const bakes = [loaf, baguette, croissant]
    return {
      title: variantOf(names, variant),
      layers: [...variantOf(bakes, variant)()],
    }
  },
}

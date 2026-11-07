import { polkaWall } from '../backdrops.ts'
import { darken, lighten } from '../color.ts'
import { type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import {
  capsule,
  circle,
  curve,
  inkLayer,
  intersect,
  paint,
  polygon,
  union,
  type Layer,
  type Shape,
} from '../raster.ts'
import { sprinkles } from './parts.ts'

interface IceCreamLook {
  readonly name: string
  readonly flavors: readonly string[]
  readonly wall: string
}

const LOOKS: readonly IceCreamLook[] = [
  { name: 'Stroberi', flavors: ['#ff9cc2'], wall: '#e0f7fa' },
  { name: 'Cokelat Vanila', flavors: ['#fff3c4', '#8d5a3b'], wall: '#fff3e0' },
  { name: 'Tiga Rasa', flavors: ['#a5d6a7', '#fff3c4', '#ff9cc2'], wall: '#ede7f6' },
]

const CONE = polygon([
  [21, 40],
  [43, 40],
  [32, 62],
])

function waffle(): Shape {
  const lines = [-12, -6, 0, 6, 12, 18].flatMap((offset) => [
    capsule([20 + offset, 40], [32 + offset, 62], 0.55),
    capsule([44 - offset, 40], [32 - offset, 62], 0.55),
  ])
  return intersect(CONE, union(...lines))
}

function scoop(cx: number, cy: number, r: number): Shape {
  const scallops = [-2, -1, 0, 1, 2].map((index) =>
    circle(cx + index * r * 0.42, cy + r * 0.62, r * 0.33),
  )
  return union(circle(cx, cy, r), ...scallops)
}

const SCOOP_LAYOUT = [
  { base: 34, radius: 13, step: 0 },
  { base: 37, radius: 10.5, step: 14 },
  { base: 39, radius: 8.5, step: 11.5 },
] as const

function scoopLayers(rng: Rng, look: IceCreamLook): Layer[] {
  const { base, radius, step } = SCOOP_LAYOUT[look.flavors.length - 1]
  const scoops = look.flavors.map((flavor, index) =>
    paint(scoop(32, base - index * step, radius), flavor),
  )
  const topCenter = base - (look.flavors.length - 1) * step
  const cherryY = topCenter - radius - 1
  return [
    ...scoops,
    ...(look.flavors.length === 2 ? sprinkles(rng, 6, circle(32, topCenter, radius - 3)) : []),
    paint(curve([32, cherryY - 2], [33, cherryY - 6], [37, cherryY - 7], 0.8), '#5d8a3a'),
    paint(circle(32, cherryY, 3.4), '#d62839'),
    paint(circle(31, cherryY - 1, 1), lighten('#d62839', 0.6)),
  ]
}

export const iceCream: Subject = {
  key: 'ice-cream',
  count: 3,
  create: (rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    return {
      title: `Es Krim ${look.name}`,
      layers: [
        ...polkaWall(look.wall, darken(look.wall, 0.07)),
        paint(CONE, '#e8b067'),
        inkLayer(waffle(), darken('#e8b067', 0.3)),
        ...scoopLayers(rng, look),
      ],
    }
  },
}

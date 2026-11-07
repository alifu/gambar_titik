import { darken, lighten } from '../color.ts'
import { INK, type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import {
  capsule,
  circle,
  curve,
  ellipse,
  inkLayer,
  intersect,
  paint,
  subtract,
  union,
  type Layer,
} from '../raster.ts'

interface AppleLook {
  readonly name: string
  readonly skin: string
  readonly bitten: boolean
}

const LOOKS: readonly AppleLook[] = [
  { name: 'Merah', skin: '#e8343f', bitten: false },
  { name: 'Hijau', skin: '#8bc34a', bitten: false },
  { name: 'Kuning Digigit', skin: '#ffd23f', bitten: true },
]

const APPLE = union(circle(25, 35, 13), circle(39, 35, 13), ellipse(32, 43, 15, 11))
const BITE = union(circle(48, 36, 5.5), circle(47, 44, 5))

function fruit(look: AppleLook): Layer[] {
  const body = look.bitten ? subtract(APPLE, BITE) : APPLE
  const flesh = intersect(APPLE, union(circle(48, 36, 7.5), circle(47, 44, 7)))
  return [
    paint(curve([32, 25], [32, 17], [35, 12], 1.5), '#7a4a2a'),
    paint(ellipse(41, 15, 6.5, 3, -0.5), '#4caf50'),
    inkLayer(capsule([36, 17.5], [45, 12.5], 0.6), darken('#4caf50', 0.4)),
    paint(body, look.skin),
    ...(look.bitten ? [paint(subtract(flesh, BITE), '#fff6d8')] : []),
    paint(ellipse(23, 30, 2.6, 4.5, 0.5), lighten(look.skin, 0.55)),
    ...(look.bitten ? [inkLayer(ellipse(44, 40, 0.9, 1.6), INK)] : []),
  ]
}

export const apple: Subject = {
  key: 'apple',
  count: 3,
  create: (_rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    return {
      title: `Apel ${look.name}`,
      layers: [...fruit(look)],
    }
  },
}

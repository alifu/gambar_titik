import { cloud, flower } from '../backdrops.ts'
import { darken, lighten } from '../color.ts'
import { INK, WHITE, type Design, type Subject, variantOf } from '../design.ts'
import { int, type Rng } from '../random.ts'
import { capsule, circle, ellipse, fill, inkLayer, paint, polygon, type Layer } from '../raster.ts'
import { thinLine } from './parts.ts'

interface BirdLook {
  readonly name: string
  readonly body: string
  readonly crest: boolean
  readonly sky: string
}

const LOOKS: readonly BirdLook[] = [
  { name: 'Biru', body: '#4fa3e3', crest: false, sky: '#fff1c9' },
  { name: 'Merah', body: '#e2483d', crest: true, sky: '#d7f2ff' },
  { name: 'Kuning', body: '#ffd23f', crest: false, sky: '#dff5d8' },
]

function scene(rng: Rng, look: BirdLook): Layer[] {
  return [
    fill(look.sky),
    paint(cloud(int(rng, 44, 52), 10, 1), WHITE),
    paint(capsule([0, 52], [64, 47], 2.6), '#8a5a2b'),
    paint(capsule([46, 49], [56, 58], 1.6), '#8a5a2b'),
    paint(ellipse(58, 58, 4, 2, 0.6), '#5cae4a'),
    paint(ellipse(8, 47, 4.5, 2, -0.5), '#5cae4a'),
    ...flower(54, 44, '#ff8fb1'),
  ]
}

function birdLayers(look: BirdLook): Layer[] {
  const crest: Layer[] = look.crest
    ? [
        paint(
          polygon([
            [19, 18],
            [23, 8],
            [27, 17],
          ]),
          look.body,
        ),
      ]
    : []
  return [
    inkLayer(capsule([27, 44], [27, 49], thinLine), INK),
    inkLayer(capsule([33, 44], [33, 49], thinLine), INK),
    paint(
      polygon([
        [40, 36],
        [58, 44],
        [55, 49],
        [37, 42],
      ]),
      darken(look.body, 0.25),
    ),
    ...crest,
    paint(ellipse(31, 36, 12.5, 9.5), look.body),
    paint(ellipse(26, 39.5, 8, 5.5), lighten(look.body, 0.55)),
    paint(circle(22, 25, 9), look.body),
    paint(ellipse(36, 34, 9, 5, 0.35), darken(look.body, 0.2)),
    paint(
      polygon([
        [14, 22],
        [6, 25.5],
        [14, 28.5],
      ]),
      '#ff9f1c',
    ),
    inkLayer(circle(19, 23, 1.7), INK),
  ]
}

export const bird: Subject = {
  key: 'bird',
  count: 3,
  create: (rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    return { title: `Burung ${look.name}`, layers: [...scene(rng, look), ...birdLayers(look)] }
  },
}

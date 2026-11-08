import { type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import {
  circle,
  ellipse,
  intersect,
  paint,
  plainPaint,
  polygon,
  rect,
  roundRect,
  union,
  type Layer,
} from '../raster.ts'

type Item = 'patty' | 'cheese' | 'tomato' | 'lettuce' | 'onion'

interface BurgerLook {
  readonly name: string
  readonly items: readonly Item[]
}

const LOOKS: readonly BurgerLook[] = [
  { name: 'Keju', items: ['patty', 'cheese', 'tomato', 'lettuce'] },
  { name: 'Dobel', items: ['patty', 'cheese', 'patty', 'cheese', 'lettuce'] },
  { name: 'Sayur', items: ['patty', 'onion', 'tomato', 'lettuce'] },
]

const HEIGHTS: Record<Item, number> = { patty: 7, cheese: 3, tomato: 4, lettuce: 4, onion: 3 }
const LEFT = 12
const RIGHT = 52

function itemLayer(item: Item, top: number): Layer {
  const bottom = top + HEIGHTS[item]
  if (item === 'patty') return paint(roundRect(LEFT, top, RIGHT, bottom, 3), '#7a4a2a')
  if (item === 'tomato') return paint(roundRect(LEFT + 2, top, RIGHT - 2, bottom, 2), '#e8463c')
  if (item === 'onion') return paint(roundRect(LEFT + 1, top, RIGHT - 1, bottom, 1.5), '#c996e0')
  if (item === 'lettuce') {
    const waves = Array.from({ length: 11 }, (_, index) =>
      circle(LEFT + 1 + index * 3.8, top + 2.5, 2.6),
    )
    return paint(union(...waves), '#7bc043')
  }
  return paint(
    polygon([
      [LEFT - 1, top],
      [RIGHT + 1, top],
      [RIGHT + 1, bottom],
      [44, bottom],
      [41, bottom + 5],
      [38, bottom],
      [26, bottom],
      [22, bottom + 4],
      [19, bottom],
      [LEFT - 1, bottom],
    ]),
    '#ffc93c',
  )
}

/** Susun isian dari bawah ke atas; tiap lapisan menindih 1 pixel lapisan bawahnya. */
function stack(items: readonly Item[], bottom: number): { layers: Layer[]; top: number } {
  let y = bottom
  const layers = items.map((item) => {
    y -= HEIGHTS[item] - 1
    return itemLayer(item, y)
  })
  return { layers, top: y }
}

function seeds(top: number): Layer {
  const points = [
    [24, top + 6],
    [32, top + 4],
    [40, top + 6],
    [28, top + 10],
    [37, top + 10],
  ] as const
  return plainPaint(union(...points.map(([x, y]) => ellipse(x, y, 2.2, 1.4, 0.4))), '#fff4d6')
}

function burgerLayers(look: BurgerLook): Layer[] {
  const bottomBun = roundRect(LEFT + 2, 48, RIGHT - 2, 56, 4)
  const filling = stack(look.items, 50)
  const domeTop = filling.top - 15
  const dome = intersect(ellipse(32, filling.top + 1, 20.5, 16), rect(0, 0, 64, filling.top + 2))
  return [
    paint(bottomBun, '#e9a956'),
    ...filling.layers,
    paint(dome, '#f0a952'),
    plainPaint(ellipse(24, domeTop + 6, 4, 2, -0.4), '#f7c98a'),
    seeds(domeTop),
  ]
}

export const burger: Subject = {
  key: 'burger',
  count: 3,
  create: (_rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    return {
      title: `Burger ${look.name}`,
      layers: [...burgerLayers(look)],
    }
  },
}

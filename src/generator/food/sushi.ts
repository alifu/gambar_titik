import { WHITE, type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import { capsule, circle, intersect, paint, rect, roundRect, union, type Layer } from '../raster.ts'

type Piece = 'salmon' | 'tamago' | 'maki-salmon' | 'maki-cucumber'

const NORI = '#2f3b33'
const RICE = WHITE
const SALMON = '#ff8c69'

interface SushiLook {
  readonly name: string
  readonly pieces: readonly [Piece, Piece, Piece]
}

const LOOKS: readonly SushiLook[] = [
  { name: 'Salmon', pieces: ['salmon', 'salmon', 'maki-salmon'] },
  { name: 'Gulung', pieces: ['maki-cucumber', 'maki-salmon', 'maki-cucumber'] },
  { name: 'Telur', pieces: ['tamago', 'salmon', 'maki-cucumber'] },
]

const SLOTS = [12, 32, 52] as const
const BOARD_TOP = 42

function nigiri(cx: number, topping: 'salmon' | 'tamago'): Layer[] {
  const rice = roundRect(cx - 8, 30, cx + 8, BOARD_TOP + 2, 4)
  const slab = roundRect(cx - 9.5, 24, cx + 9.5, 34, 4.5)
  if (topping === 'tamago') {
    return [paint(rice, RICE), paint(slab, '#ffd54f'), paint(rect(cx - 3, 23, cx + 3, 40), NORI)]
  }
  const stripes = union(
    capsule([cx - 5, 25], [cx - 8, 33], 0.9),
    capsule([cx, 25], [cx - 3, 33], 0.9),
    capsule([cx + 5, 25], [cx + 2, 33], 0.9),
  )
  return [paint(rice, RICE), paint(slab, SALMON), paint(intersect(slab, stripes), '#ffd2c2')]
}

function maki(cx: number, filling: string): Layer[] {
  const cy = 34
  return [
    paint(circle(cx, cy, 9), NORI),
    paint(circle(cx, cy, 7.3), RICE),
    paint(circle(cx, cy, 3), filling),
  ]
}

function piece(kind: Piece, cx: number): Layer[] {
  if (kind === 'salmon' || kind === 'tamago') return nigiri(cx, kind)
  return maki(cx, kind === 'maki-salmon' ? SALMON : '#7bc043')
}

function board(): Layer[] {
  return [
    paint(roundRect(4, BOARD_TOP, 60, 54, 3), '#c98b5a'),
    paint(rect(8, 54, 14, 58), '#a86b3c'),
    paint(rect(50, 54, 56, 58), '#a86b3c'),
  ]
}

function chopsticks(): Layer {
  return paint(union(capsule([6, 8], [56, 14], 1.4), capsule([8, 14], [58, 18], 1.4)), '#e8463c')
}

export const sushi: Subject = {
  key: 'sushi',
  count: 3,
  create: (_rng: Rng, variant: number): Design => {
    const look = variantOf(LOOKS, variant)
    return {
      title: `Sushi ${look.name}`,
      layers: [
        ...(variant === 1 ? [] : [chopsticks()]),
        ...board(),
        ...look.pieces.flatMap((kind, index) => piece(kind, SLOTS[index])),
      ],
    }
  },
}

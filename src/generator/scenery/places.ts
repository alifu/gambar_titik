/** Komposisi tiap jenis pemandangan (96×64). */
import { darken, lighten, mix } from '../color.ts'
import { WHITE } from '../design.ts'
import { int, pick, range, type Rng } from '../random.ts'
import { capsule, ellipse, paint, polygon, rect, union, type Layer, type Point } from '../raster.ts'
import { HEIGHT, WIDTH, skyLayers, type Mood } from './moods.ts'
import { bush, fence, flowers, house, palm, pine, roundTree, sailboat, snowman } from './props.ts'
import { hills, mountains } from './terrain.ts'

const ROOFS = ['#d9534f', '#8a5a2b', '#4b7bec', '#e67e22'] as const
const WALLS = ['#fff1d6', '#f7d9c4', '#e3f2fd', '#fde2e4'] as const

function capColor(mood: Mood): string | null {
  return mood.key === 'dusk' || mood.key === 'night' ? lighten(mood.far, 0.35) : WHITE
}

function ripples(rng: Rng, top: number, bottom: number, color: string): Layer {
  const lines = Array.from({ length: 6 }, (_, index) => {
    const x = int(rng, 6, WIDTH - 16)
    const y = top + 2 + ((bottom - top - 4) * index) / 6
    return capsule([x, y], [x + int(rng, 5, 9), y], 0.5)
  })
  return paint(union(...lines), color)
}

export function mountainScene(rng: Rng, mood: Mood): Layer[] {
  const pines = [int(rng, 8, 14), int(rng, 74, 80), int(rng, 86, 90)]
  return [
    ...skyLayers(rng, mood, 36),
    ...mountains(rng, 26, 14, mood.far, capColor(mood)),
    ...mountains(rng, 40, 6, mood.near, null),
    hills(rng, 50, 2.5, mood.grass),
    ...pines.flatMap((x, index) =>
      pine(
        x,
        int(rng, 58, 62),
        20 - index * 2,
        index % 2 ? mood.leafDark : mood.leaf,
        mood.trunk,
        mood.snow,
      ),
    ),
  ]
}

export function lakeScene(rng: Rng, mood: Mood): Layer[] {
  const treeXs = [6, 18, 30, 64, 78, 90]
  return [
    ...skyLayers(rng, mood, 34),
    ...mountains(rng, 30, 9, mood.far, capColor(mood)),
    hills(rng, 38, 1.5, mood.grassFar),
    ...treeXs.flatMap((x, index) =>
      roundTree(x + int(rng, -2, 2), 42, 3.5, index % 2 ? mood.leaf : mood.leafDark, mood.trunk),
    ),
    paint(rect(0, 41, WIDTH, 55), mood.water),
    ripples(rng, 42, 54, mood.waterLight),
    ...sailboat(int(rng, 40, 56), 49, mood.snow ? '#ff8a80' : WHITE),
    hills(rng, 57, 1.5, mood.grass),
    bush(int(rng, 8, 14), 62, mood.leafDark),
    bush(int(rng, 80, 88), 63, mood.leafDark),
  ]
}

export function beachScene(rng: Rng, mood: Mood): Layer[] {
  return [
    ...skyLayers(rng, mood, 32),
    paint(rect(0, 32, WIDTH, HEIGHT), mood.water),
    paint(rect(0, 32, WIDTH, 34), darken(mood.water, 0.15)),
    ripples(rng, 35, 46, mood.waterLight),
    ...sailboat(int(rng, 30, 50), 42, '#ff6b6b'),
    hills(rng, 49, 2, mood.sand),
    ...palm(int(rng, 76, 84), 60, mood.leaf, mix(mood.trunk, '#c49a6c', 0.5)),
    paint(ellipse(int(rng, 16, 26), 57, 3, 1.6), lighten(mood.sand, 0.4)),
    paint(polygon(starfish(int(rng, 40, 56), 58)), '#ff8a65'),
  ]
}

function starfish(cx: number, cy: number): Point[] {
  return Array.from({ length: 10 }, (_, index): Point => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5
    const radius = index % 2 === 0 ? 3.6 : 1.5
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]
  })
}

export function forestScene(rng: Rng, mood: Mood): Layer[] {
  const back = Array.from({ length: 9 }, (_, index) => index * 11 + int(rng, 2, 6))
  const front = Array.from({ length: 5 }, (_, index) => index * 21 + int(rng, 4, 10))
  const backLeaf = mix(mood.leaf, mood.grassFar, 0.45)
  return [
    ...skyLayers(rng, mood, 34),
    hills(rng, 34, 3, mood.grassFar),
    paint(rect(0, 40, WIDTH, 50), backLeaf),
    ...back.flatMap((x) => pine(x, 46, int(rng, 18, 24), backLeaf, backLeaf, mood.snow)),
    hills(rng, 52, 1.5, mood.grass),
    ...front.flatMap((x, index) =>
      pine(x, 62, int(rng, 24, 30), index % 2 ? mood.leaf : mood.leafDark, mood.trunk, mood.snow),
    ),
    ...mushroom(int(rng, 40, 52), 60),
  ]
}

function mushroom(x: number, base: number): Layer[] {
  return [
    paint(rect(x - 1.5, base - 4, x + 1.5, base), '#fff3e0'),
    paint(ellipse(x, base - 4.5, 4.5, 3), '#e53935'),
    paint(union(ellipse(x - 2, base - 5.5, 1, 0.8), ellipse(x + 1.5, base - 6, 1, 0.8)), WHITE),
  ]
}

export function villageScene(rng: Rng, mood: Mood): Layer[] {
  const houseXs = [8, 38, 68]
  const window = mood.key === 'night' || mood.key === 'dusk' ? mood.window : '#bfe9ff'
  return [
    ...skyLayers(rng, mood, 36),
    ...mountains(rng, 32, 6, mood.far, capColor(mood)),
    hills(rng, 42, 2, mood.grassFar),
    paint(rect(0, 50, WIDTH, HEIGHT), mood.grass),
    paint(
      polygon([
        [44, 52],
        [52, 52],
        [60, 64],
        [36, 64],
      ]),
      mood.snow ? '#dfe7f1' : '#e8c99a',
    ),
    ...houseXs.flatMap((x, index) =>
      house(x + int(rng, -2, 2), 52, int(rng, 17, 20), {
        wall: WALLS[index],
        roof: pick(rng, ROOFS),
        window,
        snow: mood.snow,
      }),
    ),
    ...roundTree(int(rng, 30, 33), 54, 3.5, mood.leaf, mood.trunk),
    ...roundTree(int(rng, 89, 92), 56, 4, mood.leafDark, mood.trunk),
    fence(0, 30, 62, mood.trunk),
    fence(66, WIDTH, 62, mood.trunk),
  ]
}

export function meadowScene(rng: Rng, mood: Mood): Layer[] {
  const flowerSpots: (readonly [number, number])[] = Array.from({ length: 5 }, (_, index) => [
    48 + index * 9 + int(rng, 0, 4),
    int(rng, 56, 61),
  ])
  return [
    ...skyLayers(rng, mood, 40),
    hills(rng, 36, 4, mood.grassFar),
    hills(rng, 44, 3, mix(mood.grassFar, mood.grass, 0.5)),
    ...roundTree(int(rng, 66, 74), 46, 6, mood.leaf, mood.trunk),
    hills(rng, 52, 2, mood.grass),
    fence(0, 40, 58, mood.trunk),
    ...(mood.snow
      ? snowman(int(rng, 54, 60), 62)
      : flowers(flowerSpots, mood.key === 'night' ? '#c5cae9' : '#ff7aa2')),
  ]
}

function riverBank(rng: Rng, side: -1 | 1): Point[] {
  const sway = range(rng, 5, 9)
  return Array.from({ length: 9 }, (_, index): Point => {
    const t = index / 8
    const y = 38 + t * 26
    const center = 48 + Math.sin(t * Math.PI * 1.4) * sway
    return [center + side * (1.5 + t * 14), y]
  })
}

export function riverScene(rng: Rng, mood: Mood): Layer[] {
  const left = riverBank(rng, -1)
  const right = riverBank(rng, 1).reverse()
  return [
    ...skyLayers(rng, mood, 34),
    ...mountains(rng, 32, 12, mood.far, capColor(mood)),
    paint(rect(0, 38, WIDTH, HEIGHT), mood.grass),
    paint(polygon([...left, ...right]), mood.water),
    paint(
      union(capsule([46, 52], [52, 52], 0.5), capsule([40, 60], [50, 60], 0.5)),
      mood.waterLight,
    ),
    ...pine(int(rng, 10, 16), 54, 18, mood.leafDark, mood.trunk, mood.snow),
    ...pine(int(rng, 22, 26), 46, 12, mood.leaf, mood.trunk, mood.snow),
    ...roundTree(int(rng, 76, 82), 58, 5, mood.leaf, mood.trunk),
    ...pine(int(rng, 88, 92), 50, 14, mood.leafDark, mood.trunk, mood.snow),
    ...flowers(
      [
        [int(rng, 30, 34), 60],
        [int(rng, 66, 70), 52],
      ],
      mood.snow ? '#ff8a80' : '#ffffff',
    ),
  ]
}

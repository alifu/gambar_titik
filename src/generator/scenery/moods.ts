/** Suasana pemandangan: palet warna dan elemen langit untuk pagi, siang, senja, malam, salju. */
import { cloud, star } from '../backdrops.ts'
import { WHITE } from '../design.ts'
import { int, range, type Rng } from '../random.ts'
import { circle, paint, rect, subtract, union, type Layer } from '../raster.ts'
import { scatter } from '../scatter.ts'

export const WIDTH = 96
export const HEIGHT = 64

export interface Mood {
  readonly key: 'morning' | 'day' | 'dusk' | 'night' | 'snow'
  readonly word: string
  readonly sky: readonly string[]
  readonly light: string
  readonly lightY: number
  readonly lightRadius: number
  readonly far: string
  readonly near: string
  readonly grass: string
  readonly grassFar: string
  readonly leaf: string
  readonly leafDark: string
  readonly trunk: string
  readonly water: string
  readonly waterLight: string
  readonly sand: string
  readonly window: string
  readonly snow: boolean
}

export const MOODS: readonly Mood[] = [
  {
    key: 'morning',
    word: 'Pagi',
    sky: ['#8fd3ff', '#c6ecff', '#fff1c9'],
    light: '#ffe066',
    lightY: 20,
    lightRadius: 6,
    far: '#9fb7d9',
    near: '#7fa3c9',
    grass: '#8fd16a',
    grassFar: '#b5e08a',
    leaf: '#5cae4a',
    leafDark: '#3f8f3a',
    trunk: '#8a5a2b',
    water: '#5fb7e8',
    waterLight: '#a9defa',
    sand: '#f6dc9b',
    window: '#bfe9ff',
    snow: false,
  },
  {
    key: 'day',
    word: 'Siang',
    sky: ['#4fb3f5', '#8fd3ff'],
    light: '#ffd23f',
    lightY: 10,
    lightRadius: 6.5,
    far: '#8fa9cf',
    near: '#6b8fb8',
    grass: '#7cc95a',
    grassFar: '#a8db7a',
    leaf: '#4caf50',
    leafDark: '#2e8b3a',
    trunk: '#8a5a2b',
    water: '#3fa0e0',
    waterLight: '#9fd8ff',
    sand: '#f6dc9b',
    window: '#bfe9ff',
    snow: false,
  },
  {
    key: 'dusk',
    word: 'Senja',
    sky: ['#6a4c93', '#ff7b7b', '#ffb36b', '#ffe08a'],
    light: '#ff8c42',
    lightY: 34,
    lightRadius: 10,
    far: '#8e6aa6',
    near: '#5f4b8b',
    grass: '#7c9a4a',
    grassFar: '#a3a85a',
    leaf: '#4a6b3a',
    leafDark: '#34502c',
    trunk: '#5a3a2a',
    water: '#e88a7b',
    waterLight: '#ffc59e',
    sand: '#e8b98a',
    window: '#ffd166',
    snow: false,
  },
  {
    key: 'night',
    word: 'Malam',
    sky: ['#141d3b', '#22305c', '#33467a'],
    light: '#fff4c2',
    lightY: 12,
    lightRadius: 6,
    far: '#2f3d66',
    near: '#24304f',
    grass: '#2f5a3e',
    grassFar: '#3b6a4a',
    leaf: '#24513a',
    leafDark: '#183a2a',
    trunk: '#4a3424',
    water: '#2b4f7a',
    waterLight: '#4f78a8',
    sand: '#8b7f6a',
    window: '#ffd166',
    snow: false,
  },
  {
    key: 'snow',
    word: 'Salju',
    sky: ['#b8d4ec', '#dceaf7'],
    light: '#fff4c2',
    lightY: 14,
    lightRadius: 6,
    far: '#a9b9d0',
    near: '#8aa0bf',
    grass: '#f4f8ff',
    grassFar: '#e3ecf7',
    leaf: '#3f7a5a',
    leafDark: '#2f5f46',
    trunk: '#6b4a32',
    water: '#9cc9e8',
    waterLight: '#d6ecfa',
    sand: '#e8eef5',
    window: '#ffe9a8',
    snow: true,
  },
]

function skyBands(mood: Mood, horizon: number): Layer[] {
  const band = horizon / mood.sky.length
  return mood.sky.map((color, index) =>
    paint(rect(0, index === 0 ? 0 : index * band, WIDTH, HEIGHT), color),
  )
}

const CLOUD_SLOTS = [14, 36, 58, 80] as const
const CLOUD_CLEARANCE = 20

function lightX(rng: Rng, mood: Mood): number {
  return mood.key === 'dusk' ? int(rng, 40, 56) : int(rng, 12, 84)
}

function celestial(rng: Rng, mood: Mood, x: number): Layer[] {
  const body = circle(x, mood.lightY, mood.lightRadius)
  if (mood.key !== 'night') return [paint(body, mood.light)]
  const crescent = subtract(body, circle(x + 3, mood.lightY - 2, mood.lightRadius - 1))
  const stars = scatter(rng, 7, (sx, sy) => sy < 24 && Math.abs(sx - x) > 12, 12, WIDTH, HEIGHT)
  return [
    paint(crescent, mood.light),
    paint(union(...stars.map(([sx, sy]) => star(sx, sy, 1.6))), '#ffe680'),
  ]
}

function clouds(rng: Rng, mood: Mood, sunX: number): Layer[] {
  if (mood.key === 'night') return []
  const color = mood.key === 'dusk' ? '#ffd1b3' : WHITE
  const count = mood.key === 'snow' ? 3 : 2
  const clearance = mood.key === 'dusk' ? 0 : CLOUD_CLEARANCE
  const slots = CLOUD_SLOTS.filter((slot) => Math.abs(slot - sunX) > clearance).slice(0, count)
  return slots.map((slot) =>
    paint(cloud(slot + int(rng, -3, 3), int(rng, 7, 12), range(rng, 0.9, 1.25)), color),
  )
}

export function skyLayers(rng: Rng, mood: Mood, horizon: number): Layer[] {
  const x = lightX(rng, mood)
  return [...skyBands(mood, horizon), ...celestial(rng, mood, x), ...clouds(rng, mood, x)]
}

/** Butiran salju di atas segalanya (hanya suasana salju). */
export function weather(rng: Rng, mood: Mood): Layer[] {
  if (!mood.snow) return []
  const flakes = scatter(rng, 8, () => true, 18, WIDTH, HEIGHT)
  return [paint(union(...flakes.map(([x, y]) => circle(x, y, 2))), WHITE)]
}

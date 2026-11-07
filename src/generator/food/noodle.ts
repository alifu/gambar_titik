import { plate, polkaWall, woodTable } from '../backdrops.ts'
import { darken } from '../color.ts'
import { WHITE, type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import {
  capsule,
  circle,
  curve,
  ellipse,
  inkLayer,
  intersect,
  paint,
  polyline,
  rect,
  union,
  type Layer,
  type Point,
  type Shape,
} from '../raster.ts'
import { steam } from './parts.ts'

const NOODLE = '#ffe08a'
const RIM_Y = 36

function noodleStrands(area: Shape): Layer {
  const strands = [27, 30, 33].map((y, index) =>
    curve([10, y + 2], [32, y - 4 + index], [54, y + 2], 0.6),
  )
  return inkLayer(intersect(area, union(...strands)), darken(NOODLE, 0.35))
}

function bowl(color: string): Layer[] {
  const body = intersect(ellipse(32, RIM_Y, 26, 22), rect(0, RIM_Y, 64, 64))
  return [
    paint(ellipse(32, 60, 12, 2.5), darken(color, 0.25)),
    paint(body, color),
    paint(intersect(body, rect(0, 44, 64, 47)), WHITE),
    paint(ellipse(32, RIM_Y, 26, 5), darken(color, 0.15)),
    paint(ellipse(32, RIM_Y, 23.5, 3.8), '#f4b860'),
  ]
}

function heap(): Shape {
  return intersect(ellipse(32, RIM_Y, 20, 11), rect(0, 0, 64, RIM_Y + 2))
}

function ramenToppings(): Layer[] {
  return [
    paint(rect(42, 18, 50, 34), '#2f3b33'),
    paint(ellipse(22, 30, 6, 4.5), WHITE),
    paint(ellipse(22, 30.5, 3, 2.3), '#ffb703'),
    paint(circle(36, 29, 4.5), WHITE),
    inkLayer(curve([34.5, 28], [36, 26.5], [37.5, 29], 0.6), '#ff6b9a'),
  ]
}

function chickenToppings(): Layer[] {
  return [
    paint(
      union(
        ...[
          [21, 29],
          [27, 27],
          [33, 30],
        ].map(([x, y]) => rect(x - 2.5, y - 2.5, x + 2.5, y + 2.5)),
      ),
      '#b5651d',
    ),
    paint(ellipse(43, 29, 7, 3.5, -0.4), '#5cae4a'),
    paint(union(circle(30, 34, 1.6), circle(38, 34, 1.6)), '#9ccc65'),
  ]
}

function friedNoodle(): Layer[] {
  const pile = union(
    ellipse(32, 41, 20, 9),
    circle(22, 35, 7),
    circle(32, 32, 8),
    circle(42, 35, 7),
  )
  const strands = union(
    ...[28, 32, 36, 40, 44].map((y, index) =>
      polyline(
        Array.from({ length: 12 }, (_, step): Point => [
          10 + step * 4,
          y + Math.sin(step * 1.3 + index) * 1.6,
        ]),
        0.6,
      ),
    ),
  )
  return [
    ...plate(32, 44, 30, 14),
    paint(pile, '#d98c3a'),
    inkLayer(intersect(pile, strands), darken('#d98c3a', 0.35)),
    paint(ellipse(40, 30, 7, 4.5), WHITE),
    paint(circle(41, 30, 2.6), '#ffb703'),
    paint(union(circle(13, 47, 3.4), circle(51, 47, 3.4)), '#9ccc65'),
    paint(union(circle(13, 47, 1.6), circle(51, 47, 1.6)), '#e6f5c9'),
    paint(union(circle(20, 52, 2.8), circle(44, 52, 2.8)), '#e8463c'),
  ]
}

function chopsticksAndSteam(): Layer[] {
  return [
    paint(union(capsule([30, 26], [54, 2], 1.3), capsule([35, 27], [60, 6], 1.3)), '#a86b3c'),
    inkLayer(union(steam(16, 6), steam(24, 2)), '#9aa5b1'),
  ]
}

function noodleBowl(kind: 'chicken' | 'ramen'): Layer[] {
  return [
    ...bowl(kind === 'ramen' ? '#e8463c' : '#4b7bec'),
    paint(heap(), NOODLE),
    noodleStrands(heap()),
    ...(kind === 'ramen' ? ramenToppings() : chickenToppings()),
    ...chopsticksAndSteam(),
  ]
}

export const noodle: Subject = {
  key: 'noodle',
  count: 3,
  create: (_rng: Rng, variant: number): Design => {
    const names = ['Mi Ayam', 'Ramen', 'Mi Goreng'] as const
    const backdrop =
      variant === 1 ? polkaWall('#fff3e0', '#ffe0b2') : woodTable('#e3f2fd', '#c98b5a', 48)
    const food = variant === 2 ? friedNoodle() : noodleBowl(variant === 0 ? 'chicken' : 'ramen')
    return { title: variantOf(names, variant), layers: [...backdrop, ...food] }
  },
}

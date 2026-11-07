import { plate, tablecloth, woodTable } from '../backdrops.ts'
import { lighten } from '../color.ts'
import { WHITE, type Design, type Subject, variantOf } from '../design.ts'
import { range, type Rng } from '../random.ts'
import { capsule, circle, curve, ellipse, paint, polar, type Layer, type Point } from '../raster.ts'

const YOLK = '#ffb703'

function friedEgg(rng: Rng, center: Point, size: number): Layer[] {
  const [cx, cy] = center
  const phase = range(rng, 0, Math.PI * 2)
  const white = polar(
    cx,
    cy,
    (angle) => size * (1 + 0.14 * Math.sin(angle * 3 + phase) + 0.07 * Math.sin(angle * 5)),
  )
  return [
    paint(white, WHITE),
    paint(circle(cx + 1, cy, size * 0.42), YOLK),
    paint(ellipse(cx - 0.5, cy - 1.8, size * 0.16, size * 0.1, -0.4), lighten(YOLK, 0.6)),
  ]
}

function pan(rng: Rng): Layer[] {
  return [
    paint(capsule([48, 46], [62, 60], 3.2), '#3b3f48'),
    paint(circle(28, 32, 25), '#3b3f48'),
    paint(circle(28, 32, 22), '#5f6573'),
    ...friedEgg(rng, [28, 32], 15),
  ]
}

function boiled(): Layer[] {
  const half = (cx: number, cy: number): Layer[] => [
    paint(ellipse(cx, cy, 9, 11.5), WHITE),
    paint(circle(cx, cy + 1, 5.5), YOLK),
  ]
  return [
    ...plate(32, 42, 29, 17, '#8ecae6', '#bde0fe'),
    paint(ellipse(32, 26, 8, 10.5), '#f3dcc1'),
    ...half(19, 40),
    ...half(45, 40),
  ]
}

function breakfast(rng: Rng): Layer[] {
  const bacon = (y: number): Layer[] => [
    paint(curve([12, y - 2], [32, y + 8], [52, y - 2], 3.4), '#d9534f'),
    paint(curve([13, y - 2], [32, y + 8], [51, y - 2], 1.1), '#ffb3a7'),
  ]
  return [
    ...plate(32, 34, 30, 27, '#ffd6a5', '#ffe8cc'),
    ...friedEgg(rng, [21, 27], 10),
    ...friedEgg(rng, [43, 27], 10),
    ...bacon(44),
  ]
}

export const egg: Subject = {
  key: 'egg',
  count: 3,
  create: (rng: Rng, variant: number): Design => {
    const names = ['Telur Ceplok', 'Telur Rebus', 'Sarapan Telur'] as const
    const backdrop =
      variant === 1 ? tablecloth('#e8f5e9', '#ffcc80', 30) : woodTable('#fff8e1', '#c98b5a', 0)
    const food = variant === 0 ? pan(rng) : variant === 1 ? boiled() : breakfast(rng)
    return { title: variantOf(names, variant), layers: [...backdrop, ...food] }
  },
}

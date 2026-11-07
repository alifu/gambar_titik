/** Benda-benda pemandangan: pohon, rumah, perahu, pagar, bunga. */
import { darken, lighten } from '../color.ts'
import { INK, WHITE } from '../design.ts'
import {
  circle,
  curve,
  ellipse,
  inkLayer,
  intersect,
  paint,
  polygon,
  rect,
  union,
  type Layer,
  type Shape,
} from '../raster.ts'

const PINE_TIERS = 3

function pineTier(x: number, base: number, height: number, tier: number): Shape {
  const top = base - height + tier * height * 0.22
  const bottom = top + height * 0.42
  const half = height * (0.2 + tier * 0.07)
  return polygon([
    [x, top],
    [x + half, bottom],
    [x - half, bottom],
  ])
}

export function pine(
  x: number,
  base: number,
  height: number,
  leaf: string,
  trunk: string,
  snow: boolean,
): Layer[] {
  const tiers = Array.from({ length: PINE_TIERS }, (_, tier) =>
    pineTier(x, base - 3, height - 3, tier),
  )
  const layers = [
    paint(rect(x - 1.5, base - 5, x + 1.5, base), trunk),
    paint(union(...tiers), leaf),
  ]
  if (snow) {
    const tierHeight = (height - 3) * 0.42
    const caps = tiers.map((tier, index) =>
      intersect(
        tier,
        (_, y) => y < base - height + index * (height - 3) * 0.22 + tierHeight * 0.55,
      ),
    )
    layers.push(paint(union(...caps), WHITE))
  }
  return layers
}

export function roundTree(
  x: number,
  base: number,
  size: number,
  leaf: string,
  trunk: string,
): Layer[] {
  const canopy = union(
    circle(x, base - size * 1.7, size),
    circle(x - size * 0.7, base - size * 1.2, size * 0.7),
    circle(x + size * 0.7, base - size * 1.2, size * 0.7),
  )
  return [paint(rect(x - 1.5, base - size, x + 1.5, base), trunk), paint(canopy, leaf)]
}

export interface HouseColors {
  readonly wall: string
  readonly roof: string
  readonly window: string
  readonly snow: boolean
}

export function house(x: number, base: number, width: number, colors: HouseColors): Layer[] {
  const height = width * 0.7
  const top = base - height
  const roof = polygon([
    [x - 2.5, top + 1],
    [x + width / 2, top - width * 0.45],
    [x + width + 2.5, top + 1],
  ])
  const doorX = x + width * 0.62
  const windowX = x + width * 0.14
  const windowSize = width * 0.3
  return [
    paint(
      rect(x + width * 0.7, top - width * 0.4, x + width * 0.85, top),
      darken(colors.wall, 0.3),
    ),
    paint(rect(x, top, x + width, base), colors.wall),
    paint(roof, colors.snow ? WHITE : colors.roof),
    paint(rect(doorX, base - height * 0.55, doorX + width * 0.22, base), darken(colors.roof, 0.2)),
    paint(rect(windowX, top + 3, windowX + windowSize, top + 3 + windowSize), colors.window),
    inkLayer(
      union(
        rect(
          windowX + windowSize / 2 - 0.5,
          top + 3,
          windowX + windowSize / 2 + 0.5,
          top + 3 + windowSize,
        ),
        rect(
          windowX,
          top + 3 + windowSize / 2 - 0.5,
          windowX + windowSize,
          top + 3 + windowSize / 2 + 0.5,
        ),
      ),
      INK,
    ),
  ]
}

export function sailboat(x: number, y: number, sail: string): Layer[] {
  return [
    paint(
      polygon([
        [x - 8, y],
        [x + 8, y],
        [x + 5, y + 4],
        [x - 5, y + 4],
      ]),
      '#a0522d',
    ),
    paint(rect(x - 0.5, y - 13, x + 0.5, y), '#5a3a2a'),
    paint(
      polygon([
        [x + 1, y - 13],
        [x + 1, y - 1],
        [x + 8, y - 1],
      ]),
      sail,
    ),
    paint(
      polygon([
        [x - 1, y - 10],
        [x - 1, y - 1],
        [x - 6, y - 1],
      ]),
      lighten(sail, 0.4),
    ),
  ]
}

export function palm(x: number, base: number, leaf: string, trunk: string): Layer[] {
  const top: readonly [number, number] = [x - 3, base - 24]
  const fronds = [-2.6, -1.9, -1.1, -0.4, 0.3].map((angle) =>
    ellipse(top[0] + Math.cos(angle) * 6, top[1] + Math.sin(angle) * 4 + 2, 7, 2.2, angle + 0.25),
  )
  return [
    paint(curve([x, base], [x + 3, base - 12], top, 1.8), trunk),
    paint(union(...fronds), leaf),
    paint(
      union(circle(top[0] - 1, top[1] + 3, 1.6), circle(top[0] + 2, top[1] + 3, 1.6)),
      '#7a4a2a',
    ),
  ]
}

export function fence(x0: number, x1: number, base: number, color: string): Layer {
  const posts = Array.from({ length: Math.floor((x1 - x0) / 6) + 1 }, (_, index) =>
    rect(x0 + index * 6, base - 8, x0 + index * 6 + 2, base),
  )
  return paint(
    union(...posts, rect(x0, base - 6, x1, base - 5), rect(x0, base - 3, x1, base - 2)),
    color,
  )
}

export function flowers(points: readonly (readonly [number, number])[], petal: string): Layer[] {
  return [
    paint(
      union(
        ...points.map(([x, y]) =>
          union(
            circle(x - 1.4, y, 1.3),
            circle(x + 1.4, y, 1.3),
            circle(x, y - 1.4, 1.3),
            circle(x, y + 1.4, 1.3),
          ),
        ),
      ),
      petal,
    ),
    paint(union(...points.map(([x, y]) => circle(x, y, 0.8))), '#ffd447'),
  ]
}

export function bush(x: number, base: number, color: string): Layer {
  return paint(
    union(circle(x - 3, base - 2, 3), circle(x + 1, base - 3.5, 4), circle(x + 5, base - 2, 3)),
    color,
  )
}

export function snowman(x: number, base: number): Layer[] {
  return [
    paint(circle(x, base - 6, 6), WHITE),
    paint(circle(x, base - 15, 4.5), WHITE),
    paint(
      union(rect(x - 4, base - 20, x + 4, base - 19), rect(x - 2.5, base - 26, x + 2.5, base - 19)),
      '#3d3a4a',
    ),
    paint(
      polygon([
        [x, base - 15.5],
        [x + 5, base - 14.5],
        [x, base - 13.5],
      ]),
      '#ff8a2a',
    ),
    paint(rect(x - 4, base - 11.5, x + 4, base - 10), '#e53935'),
  ]
}

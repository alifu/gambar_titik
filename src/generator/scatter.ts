import { range, type Rng } from './random.ts'
import type { Point, Shape } from './raster.ts'

const MAX_TRIES = 400

/** Ambil `count` titik acak di dalam bentuk (rejection sampling deterministik). */
export function scatter(
  rng: Rng,
  count: number,
  area: Shape,
  minGap: number,
  width = 64,
  height = 64,
): Point[] {
  const points: Point[] = []
  for (let tries = 0; tries < MAX_TRIES && points.length < count; tries++) {
    const candidate: Point = [range(rng, 0, width), range(rng, 0, height)]
    const farEnough = points.every(
      ([x, y]) => Math.hypot(x - candidate[0], y - candidate[1]) >= minGap,
    )
    if (area(candidate[0], candidate[1]) && farEnough) points.push(candidate)
  }
  return points
}

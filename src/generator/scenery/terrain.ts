import { int, range, type Rng } from '../random.ts'
import { below, intersect, paint, type Layer, type Shape } from '../raster.ts'
import { WIDTH } from './moods.ts'

const SEGMENTS = 32
const ROUGHNESS = 0.5
const NOISE = 1.2

/** Kebisingan kecil dengan midpoint displacement agar lereng tidak terlalu mulus. */
function midpointNoise(rng: Rng, amplitude: number): number[] {
  const points = new Array<number>(SEGMENTS + 1).fill(0)
  let spread = amplitude
  for (let step = SEGMENTS; step > 1; step /= 2) {
    const half = step / 2
    for (let index = half; index < SEGMENTS; index += step) {
      points[index] =
        (points[index - half] + points[index + half]) / 2 + range(rng, -spread, spread)
    }
    spread *= ROUGHNESS
  }
  return points
}

/**
 * Garis punggung gunung: beberapa puncak segitiga (tinggi acak) digabung,
 * lalu diberi midpoint displacement.
 */
export function ridge(rng: Rng, base: number, amplitude: number): number[] {
  const peakCount = int(rng, 2, 4)
  const peaks = Array.from({ length: peakCount }, (_, index) => ({
    x: ((index + 0.5) / peakCount) * WIDTH + range(rng, -8, 8),
    y: base - amplitude * range(rng, 0.6, 1),
    slope: range(rng, 0.55, 0.95),
  }))
  const noise = midpointNoise(rng, NOISE * 2)
  return Array.from({ length: WIDTH }, (_, x) => {
    const profile = Math.min(
      base,
      ...peaks.map((peak) => peak.y + Math.abs(x - peak.x) * peak.slope),
    )
    return profile + noise[Math.round((x / (WIDTH - 1)) * SEGMENTS)]
  })
}

/** Bagian gunung di atas garis salju bergerigi. */
export function snowCap(heights: readonly number[], snowLine: number): Shape {
  return intersect(below(heights), (x, y) => y < snowLine + Math.sin(x * 0.9) * 1.5)
}

export function mountains(
  rng: Rng,
  base: number,
  amplitude: number,
  color: string,
  cap: string | null,
): Layer[] {
  const heights = ridge(rng, base, amplitude)
  const peak = Math.min(...heights)
  const layers = [paint(below(heights), color)]
  if (cap !== null && base - peak > 5)
    layers.push(paint(snowCap(heights, peak + (base - peak) * 0.5), cap))
  return layers
}

/** Bukit landai: gelombang sinus halus. */
export function hills(rng: Rng, base: number, amplitude: number, color: string): Layer {
  const phase = range(rng, 0, Math.PI * 2)
  const frequency = range(rng, 1.5, 2.5)
  const heights = Array.from(
    { length: WIDTH },
    (_, x) => base + Math.sin((x / WIDTH) * Math.PI * frequency + phase) * amplitude,
  )
  return paint(below(heights), color)
}

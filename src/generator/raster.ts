/**
 * Primitif bentuk vektor sederhana yang di-rasterisasi ke grid warna.
 * Bentuk adalah fungsi murni (x, y) → boolean pada koordinat kontinu; pixel (px, py)
 * diambil sampelnya di titik tengah (px + 0.5, py + 0.5).
 */
export type Shape = (x: number, y: number) => boolean
export type Point = readonly [number, number]

export interface Layer {
  readonly shape: Shape
  readonly color: string
  /** Pixel tinta selalu menjadi garis tepi (mis. mata, mulut, kumis). */
  readonly ink: boolean
}

export interface Raster {
  readonly width: number
  readonly height: number
  readonly colors: readonly string[]
  /** Urutan lapisan yang terakhir menggambar pixel ini (0 = kanvas kosong). */
  readonly depth: readonly number[]
  readonly ink: readonly boolean[]
}

const BLANK_COLOR = '#ffffff'
const CURVE_STEPS = 18

export const fill = (color: string): Layer => ({ shape: () => true, color, ink: false })
export const paint = (shape: Shape, color: string): Layer => ({ shape, color, ink: false })
export const inkLayer = (shape: Shape, color: string): Layer => ({ shape, color, ink: true })

export const circle =
  (cx: number, cy: number, r: number): Shape =>
  (x, y) =>
    (x - cx) ** 2 + (y - cy) ** 2 <= r * r

export function ellipse(cx: number, cy: number, rx: number, ry: number, angle = 0): Shape {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return (x, y) => {
    const dx = x - cx
    const dy = y - cy
    const u = dx * cos + dy * sin
    const v = -dx * sin + dy * cos
    return (u / rx) ** 2 + (v / ry) ** 2 <= 1
  }
}

export const rect =
  (x0: number, y0: number, x1: number, y1: number): Shape =>
  (x, y) =>
    x >= x0 && x < x1 && y >= y0 && y < y1

export function roundRect(x0: number, y0: number, x1: number, y1: number, r: number): Shape {
  return (x, y) => {
    if (x < x0 || x >= x1 || y < y0 || y >= y1) return false
    const qx = Math.max(x0 + r - x, 0, x - (x1 - r))
    const qy = Math.max(y0 + r - y, 0, y - (y1 - r))
    return qx * qx + qy * qy <= r * r
  }
}

/** Poligon dengan aturan even-odd. */
export function polygon(points: readonly Point[]): Shape {
  return (x, y) => {
    let inside = false
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i]
      const [xj, yj] = points[j]
      const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
      if (crosses) inside = !inside
    }
    return inside
  }
}

/** Garis tebal dari a ke b dengan ujung bulat (radius r). */
export function capsule(a: Point, b: Point, r: number): Shape {
  const [ax, ay] = a
  const dx = b[0] - ax
  const dy = b[1] - ay
  const lengthSq = dx * dx + dy * dy
  return (x, y) => {
    const t =
      lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lengthSq))
    return (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2 <= r * r
  }
}

export function polyline(points: readonly Point[], r: number): Shape {
  const parts = points.slice(1).map((point, index) => capsule(points[index], point, r))
  return union(...parts)
}

/** Kurva Bezier kuadrat yang ditebalkan. */
export function curve(p0: Point, p1: Point, p2: Point, r: number): Shape {
  const points = Array.from({ length: CURVE_STEPS + 1 }, (_, index): Point => {
    const t = index / CURVE_STEPS
    const a = (1 - t) ** 2
    const b = 2 * (1 - t) * t
    const c = t * t
    return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]]
  })
  return polyline(points, r)
}

/** Bentuk polar: titik di dalam bila jaraknya ≤ radius(sudut). */
export const polar =
  (cx: number, cy: number, radius: (angle: number) => number): Shape =>
  (x, y) =>
    Math.hypot(x - cx, y - cy) <= radius(Math.atan2(y - cy, x - cx))

/** Area di bawah garis ketinggian per kolom (mis. gunung, ombak). */
export function below(heights: readonly number[]): Shape {
  return (x, y) => {
    const column = Math.max(0, Math.min(heights.length - 1, Math.floor(x)))
    return y >= heights[column]
  }
}

export const union =
  (...shapes: readonly Shape[]): Shape =>
  (x, y) =>
    shapes.some((shape) => shape(x, y))

export const intersect =
  (...shapes: readonly Shape[]): Shape =>
  (x, y) =>
    shapes.every((shape) => shape(x, y))

export const subtract =
  (shape: Shape, ...holes: readonly Shape[]): Shape =>
  (x, y) =>
    shape(x, y) && !holes.some((hole) => hole(x, y))

/** Cerminkan bentuk terhadap garis vertikal x = axis. */
export const mirrorX =
  (shape: Shape, axis: number): Shape =>
  (x, y) =>
    shape(2 * axis - x, y)

/** Bentuk beserta cerminannya (untuk wajah/tubuh simetris). */
export const symmetric = (shape: Shape, axis: number): Shape => union(shape, mirrorX(shape, axis))

export const translate =
  (shape: Shape, dx: number, dy: number): Shape =>
  (x, y) =>
    shape(x - dx, y - dy)

/** Gambar lapisan berurutan ke grid baru. Lapisan berikutnya menimpa yang sebelumnya. */
export function render(width: number, height: number, layers: readonly Layer[]): Raster {
  const size = width * height
  const colors = new Array<string>(size).fill(BLANK_COLOR)
  const depth = new Array<number>(size).fill(0)
  const ink = new Array<boolean>(size).fill(false)
  layers.forEach((layer, layerIndex) => {
    for (let index = 0; index < size; index++) {
      const px = index % width
      const py = Math.floor(index / width)
      if (!layer.shape(px + 0.5, py + 0.5)) continue
      colors[index] = layer.color
      depth[index] = layerIndex + 1
      ink[index] = layer.ink
    }
  })
  return { width, height, colors, depth, ink }
}

/** Juring lingkaran dari sudut start ke end (radian, searah jarum jam pada layar). */
export function sector(cx: number, cy: number, r: number, start: number, end: number): Shape {
  return (x, y) => {
    if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) return false
    const angle = Math.atan2(y - cy, x - cx)
    return angle >= start && angle <= end
  }
}

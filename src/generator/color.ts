export type Rgb = readonly [number, number, number]

const HEX_PATTERN = /^#[0-9a-f]{6}$/
const CHANNEL_MAX = 255

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_PATTERN.test(value)
}

export function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & CHANNEL_MAX, (value >> 8) & CHANNEL_MAX, value & CHANNEL_MAX]
}

export function rgbToHex([r, g, b]: Rgb): string {
  const toHex = (channel: number) =>
    Math.round(Math.min(CHANNEL_MAX, Math.max(0, channel)))
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Campur dua warna; t = 0 → a, t = 1 → b. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return rgbToHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t])
}

export function lighten(hex: string, amount: number): string {
  return mix(hex, '#ffffff', amount)
}

export function darken(hex: string, amount: number): string {
  return mix(hex, '#000000', amount)
}

type Lab = readonly [number, number, number]

const LAB_EPSILON = 216 / 24389
const LAB_KAPPA = 24389 / 27
const WHITE_POINT = [0.95047, 1, 1.08883] as const

function linearize(channel: number): number {
  const c = channel / CHANNEL_MAX
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function labPivot(t: number): number {
  return t > LAB_EPSILON ? Math.cbrt(t) : (LAB_KAPPA * t + 16) / 116
}

/** Konversi sRGB → CIELAB (D65). */
export function hexToLab(hex: string): Lab {
  const [r, g, b] = hexToRgb(hex).map(linearize)
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / WHITE_POINT[0]
  const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / WHITE_POINT[1]
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / WHITE_POINT[2]
  const [fx, fy, fz] = [labPivot(x), labPivot(y), labPivot(z)]
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/** Jarak warna persepsi (ΔE CIE76): ±2 hampir tak terlihat, >20 jelas berbeda, hitam–putih = 100. */
export function colorDistance(a: string, b: string): number {
  const [la, aa, ba] = hexToLab(a)
  const [lb, ab, bb] = hexToLab(b)
  return Math.hypot(la - lb, aa - ab, ba - bb)
}

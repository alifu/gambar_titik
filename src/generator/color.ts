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

/** Jarak warna kuadrat dengan bobot persepsi sederhana. */
export function colorDistance(a: string, b: string): number {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return 2 * (ar - br) ** 2 + 4 * (ag - bg) ** 2 + 3 * (ab - bb) ** 2
}

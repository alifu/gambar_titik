export const RECENT_COLORS_LIMIT = 12

const SHORT_HEX = /^[0-9a-f]{3}$/
const LONG_HEX = /^[0-9a-f]{6}$/

/**
 * Normalisasi input HEX user menjadi `#rrggbb` huruf kecil.
 * Menerima `#abc`, `abc`, `#AABBCC`, `aabbcc` (spasi di tepi diabaikan). Selain itu → null.
 */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().toLowerCase().replace(/^#/, '')
  if (LONG_HEX.test(raw)) return `#${raw}`
  if (SHORT_HEX.test(raw)) {
    return `#${[...raw].map((c) => c + c).join('')}`
  }
  return null
}

/** true jika sudah dalam format simpan `#rrggbb` huruf kecil. */
export function isStoredHex(value: string): boolean {
  return value.startsWith('#') && LONG_HEX.test(value.slice(1))
}

/** Taruh `color` paling depan, buang duplikat, batasi `RECENT_COLORS_LIMIT` warna. */
export function addRecentColor(recent: readonly string[], color: string): readonly string[] {
  if (recent[0] === color) return recent
  return [color, ...recent.filter((c) => c !== color)].slice(0, RECENT_COLORS_LIMIT)
}

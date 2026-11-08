/** Nama warna Bahasa Indonesia otomatis: cari nama terdekat dari daftar, unik dalam satu palet. */
import { colorDistance, hexToLab } from './color.ts'

export const OUTLINE_NAME = 'Hitam'

interface NamedColor {
  readonly name: string
  readonly hex: string
}

/** Daftar nama warna (selain hitam, yang khusus untuk garis tepi). */
export const COLOR_NAMES: readonly NamedColor[] = [
  { name: 'Putih', hex: '#ffffff' },
  { name: 'Abu-abu Muda', hex: '#d3d6dc' },
  { name: 'Abu-abu', hex: '#9a9ea8' },
  { name: 'Abu-abu Tua', hex: '#55565f' },
  { name: 'Abu-abu Kebiruan', hex: '#8a9bb8' },
  { name: 'Merah', hex: '#e53935' },
  { name: 'Merah Tua', hex: '#a3242a' },
  { name: 'Merah Bata', hex: '#c0583a' },
  { name: 'Merah Muda', hex: '#ff9fb8' },
  { name: 'Merah Muda Pucat', hex: '#fbd3de' },
  { name: 'Merah Jambu', hex: '#f06292' },
  { name: 'Salem', hex: '#ff8a70' },
  { name: 'Persik', hex: '#ffcba4' },
  { name: 'Oranye', hex: '#f58a1f' },
  { name: 'Oranye Muda', hex: '#ffb45e' },
  { name: 'Oranye Tua', hex: '#d0621b' },
  { name: 'Kuning', hex: '#ffd93b' },
  { name: 'Kuning Muda', hex: '#fff3a0' },
  { name: 'Kuning Tua', hex: '#e8a917' },
  { name: 'Krem', hex: '#f8e7c4' },
  { name: 'Krem Muda', hex: '#fff7e6' },
  { name: 'Krem Tua', hex: '#e6c48f' },
  { name: 'Cokelat Muda', hex: '#c98b55' },
  { name: 'Cokelat', hex: '#8a5a2b' },
  { name: 'Cokelat Tua', hex: '#5a3826' },
  { name: 'Hijau Muda', hex: '#a8db7a' },
  { name: 'Hijau', hex: '#4caf50' },
  { name: 'Hijau Tua', hex: '#2e6b3a' },
  { name: 'Hijau Pucat', hex: '#dcefcf' },
  { name: 'Hijau Kekuningan', hex: '#c5d55a' },
  { name: 'Hijau Lumut', hex: '#7c8a3a' },
  { name: 'Toska', hex: '#3cbfae' },
  { name: 'Biru Langit', hex: '#8fd3ff' },
  { name: 'Biru Muda', hex: '#c6e8ff' },
  { name: 'Biru Pucat', hex: '#e4eef9' },
  { name: 'Biru', hex: '#3f8fe0' },
  { name: 'Biru Tua', hex: '#24407a' },
  { name: 'Biru Laut', hex: '#2b6fb0' },
  { name: 'Ungu Muda', hex: '#cdb4f0' },
  { name: 'Ungu', hex: '#8e5bc4' },
  { name: 'Ungu Tua', hex: '#4b2f6e' },
  { name: 'Lavender', hex: '#b9a8e6' },
]

/** Nama bebas lebih jauh dari ini × jarak nama terbaik → pakai varian Muda/Tua atau nomor. */
const FALLBACK_FACTOR = 2
const FALLBACK_SLACK = 6

function byDistance(hex: string): NamedColor[] {
  return [...COLOR_NAMES].sort((a, b) => colorDistance(hex, a.hex) - colorDistance(hex, b.hex))
}

function numbered(base: string, used: ReadonlySet<string>): string {
  let suffix = 2
  while (used.has(`${base} ${suffix}`)) suffix++
  return `${base} ${suffix}`
}

/** "Hijau" → "Hijau Muda"/"Hijau Tua" menurut terang-gelap; nama yang sudah bervarian → null. */
function shadeVariant(hex: string, best: NamedColor): string | null {
  if (/ (Muda|Tua|Pucat)$/.test(best.name)) return null
  return `${best.name} ${hexToLab(hex)[0] >= hexToLab(best.hex)[0] ? 'Muda' : 'Tua'}`
}

function nameFor(hex: string, used: ReadonlySet<string>): string {
  const ranked = byDistance(hex)
  const best = ranked[0]
  const limit = colorDistance(hex, best.hex) * FALLBACK_FACTOR + FALLBACK_SLACK
  const free = ranked.find((candidate) => !used.has(candidate.name))
  if (free !== undefined && colorDistance(hex, free.hex) <= limit) return free.name
  const variant = shadeVariant(hex, best)
  return variant !== null && !used.has(variant) ? variant : numbered(best.name, used)
}

/** Nama untuk tiap warna (urutan dipertahankan; warna lebih awal mendapat nama terbaik). */
export function nameColors(hexes: readonly string[]): string[] {
  return hexes.reduce<string[]>(
    (names, hex) => [...names, nameFor(hex, new Set([OUTLINE_NAME, ...names]))],
    [],
  )
}

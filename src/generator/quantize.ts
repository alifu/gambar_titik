import { colorDistance } from './color.ts'

export const MAX_PALETTE_SIZE = 16

/** Hitung warna diurutkan dari yang paling sering muncul (seri: urut hex). */
export function rankColors(colors: readonly string[]): string[] {
  const counts = new Map<string, number>()
  colors.forEach((color) => counts.set(color, (counts.get(color) ?? 0) + 1))
  return [...counts.entries()]
    .sort(([a, countA], [b, countB]) => (countB !== countA ? countB - countA : a.localeCompare(b)))
    .map(([color]) => color)
}

function nearest(color: string, candidates: readonly string[]): string {
  return candidates.reduce((best, candidate) =>
    colorDistance(color, candidate) < colorDistance(color, best) ? candidate : best,
  )
}

/**
 * Kurangi jumlah warna menjadi ≤ maxColors: warna yang paling jarang dipetakan ke
 * warna tersisa terdekat. Mengembalikan array warna baru.
 */
export function quantizeColors(colors: readonly string[], maxColors = MAX_PALETTE_SIZE): string[] {
  const ranked = rankColors(colors)
  if (ranked.length <= maxColors) return [...colors]
  const kept = ranked.slice(0, maxColors)
  const mapping = new Map(
    ranked.map((color) => [color, kept.includes(color) ? color : nearest(color, kept)]),
  )
  return colors.map((color) => mapping.get(color) as string)
}

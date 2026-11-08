import { colorDistance } from './color.ts'
import { OUTLINE_HEX, type Cell } from './outline.ts'

/** Jumlah warna maksimal per gambar, termasuk hitam. */
export const MAX_PALETTE_SIZE = 12
/** Warna yang sejarak ini atau lebih dekat selalu digabung (terlalu mirip untuk dibedakan). */
export const MERGE_DISTANCE = 7

function colorCounts(cells: readonly Cell[]): [string, number][] {
  const counts = new Map<string, number>()
  cells.forEach((cell) => {
    if (cell !== null && cell !== OUTLINE_HEX) counts.set(cell, (counts.get(cell) ?? 0) + 1)
  })
  return [...counts.entries()].sort(([a, countA], [b, countB]) =>
    countB !== countA ? countB - countA : a.localeCompare(b),
  )
}

/** Hitung warna (selain latar & hitam) diurutkan dari yang paling sering (seri: urut hex). */
export function rankColors(cells: readonly Cell[]): string[] {
  return colorCounts(cells).map(([color]) => color)
}

interface Pair {
  readonly keep: string
  readonly drop: string
  readonly distance: number
  readonly cost: number
}

/**
 * Pasangan yang paling murah digabung; warna yang lebih jarang yang dibuang.
 * Biaya = jarak × √(jumlah kotak warna yang dibuang), sehingga area besar yang berbeda
 * (mis. gunung vs langit) bertahan dan detail kecil yang mirip digabung lebih dulu.
 */
function cheapestPair(entries: readonly [string, number][], weighted: boolean): Pair | null {
  let best: Pair | null = null
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const distance = colorDistance(entries[i][0], entries[j][0])
      const cost = weighted ? distance * Math.sqrt(entries[j][1]) : distance
      if (best === null || cost < best.cost) {
        best = { keep: entries[i][0], drop: entries[j][0], distance, cost }
      }
    }
  }
  return best
}

function mergeStep(
  cells: readonly Cell[],
  maxColors: number,
  mergeDistance: number,
): Cell[] | null {
  const entries = colorCounts(cells)
  const closest = cheapestPair(entries, false)
  if (closest === null) return null
  const tooMany = entries.length > maxColors - 1
  const pair =
    closest.distance <= mergeDistance ? closest : tooMany ? cheapestPair(entries, true) : null
  if (pair === null) return null
  return cells.map((cell) => (cell === pair.drop ? pair.keep : cell))
}

/**
 * Kurangi warna sampai ≤ maxColors (termasuk hitam): warna yang hampir sama selalu digabung,
 * lalu pasangan termurah (lihat `cheapestPair`) digabung; warna jarang mengikuti yang sering. Mengembalikan array baru.
 */
export function reducePalette(
  cells: readonly Cell[],
  maxColors = MAX_PALETTE_SIZE,
  mergeDistance = MERGE_DISTANCE,
): Cell[] {
  let current = [...cells]
  for (;;) {
    const next = mergeStep(current, maxColors, mergeDistance)
    if (next === null) return current
    current = next
  }
}

/**
 * Garis tepi hitam tebal 1 kotak, gaya lembar "warnai sesuai nomor":
 * di batas subjek–latar dan batas antar-warna yang kontras, kotak milik lapisan yang lebih
 * belakang menjadi hitam (sehingga detail depan tetap utuh, dan siluet tertutup rapat).
 */
import { colorDistance } from './color.ts'
import type { Raster } from './raster.ts'
import { labelRegions, neighbors } from './regions.ts'

/** Warna kotak setelah diproses; `null` = latar. */
export type Cell = string | null

export const OUTLINE_HEX = '#000000'
/** Warna lebih dekat dari ini (ΔE) ke hitam dianggap hitam. */
const NEAR_BLACK = 15
/** Tinta (mata, mulut) yang cukup gelap menjadi kotak hitam. */
const INK_TO_BLACK = 40
/** Batas antar-warna dengan jarak ≥ ini (ΔE) diberi garis tepi; di bawahnya dianggap gradasi. */
export const EDGE_CONTRAST = 20
/** Region warna (selain hitam) minimal sebesar ini (kotak) di gambar akhir. */
export const MIN_ISLAND = 3
/** Detail sebelum diberi garis tepi minimal sebesar ini, agar tidak menjadi gumpalan hitam. */
export const MIN_DETAIL = 4
const MAX_PASSES = 6

function blackCell(raster: Raster, index: number): boolean {
  const color = raster.colors[index]
  if (color === null) return false
  const distance = colorDistance(color, OUTLINE_HEX)
  return distance < NEAR_BLACK || (raster.ink[index] && distance < INK_TO_BLACK)
}

/** Kelompok anggota region (warna sama, 4-arah) yang lebih kecil dari minSize. */
function smallRegions(
  cells: readonly Cell[],
  width: number,
  height: number,
  minSize: number,
  include: (index: number) => boolean,
): number[][] {
  const { labels, sizes } = labelRegions(width, height, include, (a, b) => cells[a] === cells[b])
  const groups = sizes.map((): number[] => [])
  labels.forEach((label, index) => {
    if (label >= 0 && sizes[label] < minSize) groups[label].push(index)
  })
  return groups.filter((members) => members.length > 0)
}

/** Tetangga (selain region itu sendiri) yang paling sering menyentuh region; hitam/latar dihindari. */
function donorIndex(
  cells: readonly Cell[],
  members: readonly number[],
  width: number,
  height: number,
): number | null {
  const own = cells[members[0]]
  const counts = new Map<Cell, { count: number; index: number }>()
  for (const index of members) {
    for (const next of neighbors(index, width, height)) {
      const color = cells[next]
      if (color === own) continue
      counts.set(color, { count: (counts.get(color)?.count ?? 0) + 1, index: next })
    }
  }
  const rank = (color: Cell) => (color === null ? 2 : color === OUTLINE_HEX ? 1 : 0)
  const ranked = [...counts.entries()].sort(([colorA, a], [colorB, b]) =>
    rank(colorA) !== rank(colorB)
      ? rank(colorA) - rank(colorB)
      : b.count - a.count || String(colorA).localeCompare(String(colorB)),
  )
  return ranked[0]?.[1].index ?? null
}

/** Detail warna yang terlalu kecil diambil alih tetangganya sebelum garis tepi dibuat. */
export function absorbSmallDetails(raster: Raster, minSize = MIN_DETAIL): Raster {
  const { width, height } = raster
  const colors = [...raster.colors]
  const depth = [...raster.depth]
  const soft = [...raster.soft]
  const plain = [...raster.plain]
  const include = (index: number) => colors[index] !== null && !blackCell(raster, index)
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const groups = smallRegions(colors, width, height, minSize, include)
    if (groups.length === 0) break
    groups.forEach((members) => {
      const donor = donorIndex(colors, members, width, height)
      if (donor === null) return
      const [color, d, s, p] = [colors[donor], depth[donor], soft[donor], plain[donor]]
      members.forEach((index) => {
        colors[index] = color
        depth[index] = d
        soft[index] = s
        plain[index] = p
      })
    })
  }
  return { ...raster, colors, depth, soft, plain }
}

/** Pasangan tetangga: kanan & bawah (4-arah), plus diagonal untuk batas subjek–latar. */
function pairs(index: number, width: number, height: number): number[] {
  const x = index % width
  const y = Math.floor(index / width)
  const result: number[] = []
  if (x < width - 1) result.push(index + 1)
  if (y < height - 1) {
    result.push(index + width)
    if (x < width - 1) result.push(index + width + 1)
    if (x > 0) result.push(index + width - 1)
  }
  return result
}

/** Tambahkan garis tepi hitam. Mengembalikan array baru. */
export function traceOutline(raster: Raster, edgeContrast = EDGE_CONTRAST): Cell[] {
  const { width, height, depth, soft, plain } = raster
  const base = raster.colors.map((color, index) => (blackCell(raster, index) ? OUTLINE_HEX : color))
  const needsEdge = (a: number, b: number): boolean => {
    const [ca, cb] = [base[a], base[b]]
    if (ca === cb || ca === OUTLINE_HEX || cb === OUTLINE_HEX) return false
    if (ca === null || cb === null) return true
    if (plain[a] || plain[b] || (soft[a] && soft[b])) return false
    return colorDistance(ca, cb) >= edgeContrast
  }
  const result = [...base]
  base.forEach((cell, a) => {
    for (const b of pairs(a, width, height)) {
      const isDiagonal = b !== a + 1 && b !== a + width
      if (isDiagonal && cell !== null && base[b] !== null) continue
      if (needsEdge(a, b)) result[depth[a] <= depth[b] ? a : b] = OUTLINE_HEX
    }
  })
  return result
}

/** Region warna (bukan hitam/latar) yang lebih kecil dari minSize diambil alih tetangganya. */
export function removeIslands(
  cells: readonly Cell[],
  width: number,
  height: number,
  minSize = MIN_ISLAND,
): Cell[] {
  const current = [...cells]
  const include = (index: number) => current[index] !== null && current[index] !== OUTLINE_HEX
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const groups = smallRegions(current, width, height, minSize, include)
    if (groups.length === 0) break
    groups.forEach((members) => {
      const donor = donorIndex(current, members, width, height)
      const color = donor === null ? OUTLINE_HEX : (current[donor] ?? OUTLINE_HEX)
      members.forEach((index) => {
        current[index] = color
      })
    })
  }
  return current
}

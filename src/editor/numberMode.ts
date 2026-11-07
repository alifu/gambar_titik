import { referenceColor } from '../render/pixelColors'
import { BACKGROUND, BACKGROUND_SYMBOL, type Artwork } from '../types/artwork'
import type { PixelColors } from './tools'

/** Warna kotak yang belum terisi (dan kotak latar) di mode nomor. */
export const NUMBER_EMPTY_FILL = '#ffffff'
/** Warna kotak kosong yang kodenya sama dengan warna terpilih (highlight). */
export const NUMBER_HIGHLIGHT_FILL = '#cfc9e0'

function isInRange(artwork: Artwork, index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < artwork.pixels.length
}

/** true jika kotak non-latar `index` sudah berwarna sesuai kodenya. */
export function isCellCorrect(artwork: Artwork, colors: PixelColors, index: number): boolean {
  const expected = referenceColor(artwork, index)
  const color = colors[index]
  return expected !== null && color != null && color.toLowerCase() === expected.toLowerCase()
}

/**
 * Isi kotak `indices` yang kodenya = `paletteIndex` dengan warna kode itu.
 * Kotak latar, kotak kode lain, dan kotak yang sudah benar tidak berubah.
 * Jika tidak ada yang berubah, `colors` dikembalikan apa adanya (referensi sama).
 */
export function fillMatching(
  artwork: Artwork,
  colors: PixelColors,
  indices: readonly number[],
  paletteIndex: number,
): PixelColors {
  const targets = indices.filter(
    (i) =>
      isInRange(artwork, i) &&
      artwork.pixels[i] === paletteIndex &&
      !isCellCorrect(artwork, colors, i),
  )
  if (targets.length === 0) return colors
  const next = [...colors]
  targets.forEach((i) => {
    next[i] = referenceColor(artwork, i)
  })
  return next
}

/** Kotak di `indices` yang ditolak: bukan latar, kode lain, dan belum benar. Tanpa duplikat. */
export function mismatchedIndices(
  artwork: Artwork,
  colors: PixelColors,
  indices: readonly number[],
  paletteIndex: number,
): number[] {
  const rejected = indices.filter((i) => {
    if (!isInRange(artwork, i)) return false
    const value = artwork.pixels[i]
    return value !== BACKGROUND && value !== paletteIndex && !isCellCorrect(artwork, colors, i)
  })
  return [...new Set(rejected)]
}

function neighbors4(artwork: Artwork, index: number): number[] {
  const { width, height } = artwork
  const x = index % width
  const y = Math.floor(index / width)
  const result: number[] = []
  if (y > 0) result.push(index - width)
  if (y < height - 1) result.push(index + width)
  if (x > 0) result.push(index - 1)
  if (x < width - 1) result.push(index + 1)
  return result
}

/** Semua kotak berkode sama yang terhubung 4-arah dengan `start` (kosong untuk latar/di luar grid). */
export function codeRegionIndices(artwork: Artwork, start: number): number[] {
  if (!isInRange(artwork, start) || artwork.pixels[start] === BACKGROUND) return []
  const value = artwork.pixels[start]
  const visited = new Set<number>([start])
  const queue = [start]
  for (let head = 0; head < queue.length; head++) {
    neighbors4(artwork, queue[head])
      .filter((n) => artwork.pixels[n] === value && !visited.has(n))
      .forEach((n) => {
        visited.add(n)
        queue.push(n)
      })
  }
  return queue
}

/** Isi area: kotak berkode `paletteIndex` yang terhubung 4-arah dengan `start`. Kode lain → tidak berubah. */
export function fillCodeRegion(
  artwork: Artwork,
  colors: PixelColors,
  start: number,
  paletteIndex: number,
): PixelColors {
  if (!isInRange(artwork, start) || artwork.pixels[start] !== paletteIndex) return colors
  return fillMatching(artwork, colors, codeRegionIndices(artwork, start), paletteIndex)
}

/** Sisa kotak yang belum benar untuk tiap entri palet (indeks sama dengan `palette`). */
export function remainingByPalette(artwork: Artwork, colors: PixelColors): number[] {
  const remaining = artwork.palette.map(() => 0)
  artwork.pixels.forEach((value, i) => {
    if (value === BACKGROUND || remaining[value] === undefined) return
    if (!isCellCorrect(artwork, colors, i)) remaining[value]++
  })
  return remaining
}

/** true jika gambar punya kotak non-latar dan semuanya sudah benar. */
export function isNumberComplete(artwork: Artwork, colors: PixelColors): boolean {
  let hasCells = false
  const allCorrect = artwork.pixels.every((value, i) => {
    if (value === BACKGROUND) return true
    hasCells = true
    return isCellCorrect(artwork, colors, i)
  })
  return hasCells && allCorrect
}

/** Entri palet pertama yang masih punya sisa kotak (0 jika semua tuntas). */
export function firstUnfinishedPalette(artwork: Artwork, colors: PixelColors): number {
  const index = remainingByPalette(artwork, colors).findIndex((n) => n > 0)
  return Math.max(0, index)
}

/** Indeks palet untuk tombol keyboard (kode `0`–`9`, `A`–`Z`, tanpa beda huruf besar/kecil). */
export function paletteIndexForKey(artwork: Artwork, key: string): number | null {
  if (key.length !== 1) return null
  const upper = key.toUpperCase()
  const index = artwork.palette.findIndex((entry) => entry.code.toUpperCase() === upper)
  return index < 0 ? null : index
}

/** Warna tampilan mode nomor: benar = warna kode, kosong = putih, kosong berkode terpilih = highlight. */
export function numberDisplayColors(
  artwork: Artwork,
  colors: PixelColors,
  selected: number,
): readonly string[] {
  return artwork.pixels.map((value, i) => {
    if (value === BACKGROUND) return NUMBER_EMPTY_FILL
    if (isCellCorrect(artwork, colors, i)) return referenceColor(artwork, i) ?? NUMBER_EMPTY_FILL
    return value === selected ? NUMBER_HIGHLIGHT_FILL : NUMBER_EMPTY_FILL
  })
}

/** Teks di tiap kotak: latar = "·", kotak belum benar = kodenya, kotak benar = '' (disembunyikan). */
export function numberLabels(artwork: Artwork, colors: PixelColors): readonly string[] {
  return artwork.pixels.map((value, i) => {
    if (value === BACKGROUND) return BACKGROUND_SYMBOL
    if (isCellCorrect(artwork, colors, i)) return ''
    return artwork.palette[value]?.code ?? ''
  })
}

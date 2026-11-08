import { referenceColor } from '../render/pixelColors'
import { BACKGROUND, BACKGROUND_SYMBOL, type Artwork } from '../types/artwork'
import type { PixelColors } from './tools'

/** Warna kotak yang belum terisi (dan kotak latar) di mode nomor. */
export const NUMBER_EMPTY_FILL = '#ffffff'
/** Warna kotak kosong yang kodenya sama dengan warna terpilih (highlight). */
export const NUMBER_HIGHLIGHT_FILL = '#c4b5fd'
/** Rentang abu kotak kosong berkode: warna contoh tergelap → terang (kontras ke kode ≥ 4.5:1). */
const EMPTY_GRAY_DARKEST = 0xb0
const EMPTY_GRAY_LIGHTEST = 0xf4
const LUMA_WEIGHTS = [0.299, 0.587, 0.114] as const
const MAX_CHANNEL = 255

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

/**
 * Abu terang untuk kotak kosong non-latar `index`, diturunkan dari kecerahan warna contohnya
 * agar bentuk gambar tetap terlihat saat kode tidak terbaca. Latar/di luar grid = putih.
 */
export function numberModeEmptyColor(artwork: Artwork, index: number): string {
  const hex = referenceColor(artwork, index)
  if (hex === null || !/^#[0-9a-f]{6}$/i.test(hex)) return NUMBER_EMPTY_FILL
  const luma = LUMA_WEIGHTS.reduce(
    (sum, weight, c) => sum + weight * parseInt(hex.slice(1 + c * 2, 3 + c * 2), 16),
    0,
  )
  const level = Math.round(
    EMPTY_GRAY_DARKEST + (luma / MAX_CHANNEL) * (EMPTY_GRAY_LIGHTEST - EMPTY_GRAY_DARKEST),
  )
  const channel = level.toString(16).padStart(2, '0')
  return `#${channel}${channel}${channel}`
}

/** Warna tampilan mode nomor: benar = warna kode, kosong = abu terang per kode, terpilih = highlight. */
export function numberDisplayColors(
  artwork: Artwork,
  colors: PixelColors,
  selected: number,
): readonly string[] {
  return artwork.pixels.map((value, i) => {
    if (value === BACKGROUND) return NUMBER_EMPTY_FILL
    if (isCellCorrect(artwork, colors, i)) return referenceColor(artwork, i) ?? NUMBER_EMPTY_FILL
    return value === selected ? NUMBER_HIGHLIGHT_FILL : numberModeEmptyColor(artwork, i)
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

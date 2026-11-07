import { isOutline } from '../render/pixelColors'
import type { Artwork } from '../types/artwork'

/** Warna user per pixel (`#rrggbb` atau null = belum diwarnai). */
export type PixelColors = readonly (string | null)[]

export type Tool = 'brush' | 'bucket' | 'eraser' | 'picker'
export type BrushSize = 1 | 2 | 3
export const BRUSH_SIZES: readonly BrushSize[] = [1, 2, 3]

/** Array kosong (semua null) seukuran artwork. */
export function emptyColors(artwork: Artwork): PixelColors {
  return new Array<string | null>(artwork.width * artwork.height).fill(null)
}

function isInside(artwork: Artwork, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < artwork.width && y < artwork.height
}

/**
 * Indeks pixel yang tersentuh kuas berbentuk persegi.
 * Ukuran 1 = pixel itu saja, 2 = pixel + kanan/bawah, 3 = pixel + tetangga 8 arah.
 * Bagian kuas di luar kanvas dibuang.
 */
export function brushIndices(artwork: Artwork, center: number, size: BrushSize): number[] {
  const cx = center % artwork.width
  const cy = Math.floor(center / artwork.width)
  const start = size === 3 ? -1 : 0
  const indices: number[] = []
  for (let dy = start; dy < start + size; dy++) {
    for (let dx = start; dx < start + size; dx++) {
      const x = cx + dx
      const y = cy + dy
      if (isInside(artwork, x, y)) indices.push(y * artwork.width + x)
    }
  }
  return indices
}

/** Indeks pixel di sepanjang garis lurus dari `from` ke `to` (Bresenham), agar drag cepat tidak bolong. */
export function lineIndices(artwork: Artwork, from: number, to: number): number[] {
  const w = artwork.width
  let x = from % w
  let y = Math.floor(from / w)
  const x1 = to % w
  const y1 = Math.floor(to / w)
  const dx = Math.abs(x1 - x)
  const dy = -Math.abs(y1 - y)
  const sx = x < x1 ? 1 : -1
  const sy = y < y1 ? 1 : -1
  let err = dx + dy
  const indices = [y * w + x]
  while (x !== x1 || y !== y1) {
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x += sx
    }
    if (e2 <= dx) {
      err += dx
      y += sy
    }
    indices.push(y * w + x)
  }
  return indices
}

/**
 * Warnai pixel `indices` dengan `color` (null = hapus). Pixel outline dan indeks di luar kanvas diabaikan.
 * Tidak pernah mengubah input; jika tidak ada pixel yang berubah, array input dikembalikan apa adanya
 * (referensi sama) sehingga pemanggil bisa mendeteksi "tidak ada perubahan".
 */
export function paintPixels(
  artwork: Artwork,
  colors: PixelColors,
  indices: readonly number[],
  color: string | null,
): PixelColors {
  const targets = indices.filter(
    (i) => i >= 0 && i < colors.length && !isOutline(artwork, i) && colors[i] !== color,
  )
  if (targets.length === 0) return colors
  const next = [...colors]
  targets.forEach((i) => {
    next[i] = color
  })
  return next
}

/** Hapus warna pixel `indices` (outline tetap). */
export function erase(
  artwork: Artwork,
  colors: PixelColors,
  indices: readonly number[],
): PixelColors {
  return paintPixels(artwork, colors, indices, null)
}

/** Tetangga 4-arah (atas, bawah, kiri, kanan) yang masih di dalam kanvas. */
function neighbors4(artwork: Artwork, index: number): number[] {
  const x = index % artwork.width
  const y = Math.floor(index / artwork.width)
  const candidates: [number, number][] = [
    [x, y - 1],
    [x, y + 1],
    [x - 1, y],
    [x + 1, y],
  ]
  return candidates
    .filter(([nx, ny]) => isInside(artwork, nx, ny))
    .map(([nx, ny]) => ny * artwork.width + nx)
}

/** Semua indeks pada region non-outline 4-arah yang memuat `start` (kosong jika start = outline). */
export function regionIndices(artwork: Artwork, start: number): number[] {
  if (start < 0 || start >= artwork.pixels.length || isOutline(artwork, start)) return []
  const visited = new Set<number>([start])
  const queue = [start]
  for (let head = 0; head < queue.length; head++) {
    neighbors4(artwork, queue[head])
      .filter((n) => !isOutline(artwork, n) && !visited.has(n))
      .forEach((n) => {
        visited.add(n)
        queue.push(n)
      })
  }
  return queue
}

/**
 * Ember: isi seluruh region yang dibatasi outline (4-arah, tidak bocor lewat diagonal, berhenti
 * di outline/tepi kanvas). Region ditentukan oleh outline saja, BUKAN oleh warna yang sudah ada:
 * semua pixel di region itu menjadi `color`, termasuk yang sebelumnya sudah diwarnai lain.
 * Klik pada outline tidak mengubah apa pun.
 */
export function floodFill(
  artwork: Artwork,
  colors: PixelColors,
  startIndex: number,
  color: string | null,
): PixelColors {
  return paintPixels(artwork, colors, regionIndices(artwork, startIndex), color)
}

/** Pipet: warna user pada pixel itu, atau null jika outline/belum diwarnai/di luar kanvas. */
export function pickColor(artwork: Artwork, colors: PixelColors, index: number): string | null {
  if (index < 0 || index >= colors.length || isOutline(artwork, index)) return null
  return colors[index] ?? null
}

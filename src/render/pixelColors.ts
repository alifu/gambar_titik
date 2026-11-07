import { BACKGROUND, OUTLINE_CODE, type Artwork } from '../types/artwork'
import type { ColoringMode } from '../types/progress'

/** Warna garis tepi (kode `0`) yang dipakai saat palet tidak punya entri kode `0`. */
export const OUTLINE_COLOR = '#000000'
/** Warna kotak yang belum diwarnai (dan kotak latar). */
export const EMPTY_COLOR = '#ffffff'

/** 'user' = warna user, 'reference' = kunci jawaban (warna contoh). */
export type PixelViewMode = 'user' | 'reference'
export type PixelColors = readonly (string | null)[]

/** true jika kotak `index` adalah latar ("·"): tidak perlu diwarnai. */
export function isBackground(artwork: Artwork, index: number): boolean {
  return artwork.pixels[index] === BACKGROUND
}

/**
 * Kode warna kotak `index` (`0`–`9`, `A`–`Z`), atau null untuk kotak latar / indeks di luar grid.
 */
export function codeAt(artwork: Artwork, index: number): string | null {
  const value = artwork.pixels[index]
  if (value === undefined || value === BACKGROUND) return null
  return artwork.palette[value]?.code ?? null
}

/** true jika kotak `index` adalah garis tepi hitam (kode `0`). */
export function isOutline(artwork: Artwork, index: number): boolean {
  return codeAt(artwork, index) === OUTLINE_CODE
}

/** Warna contoh (hex) kotak `index`, atau null untuk kotak latar. */
export function referenceColor(artwork: Artwork, index: number): string | null {
  const value = artwork.pixels[index]
  if (value === undefined || value === BACKGROUND) return null
  return artwork.palette[value]?.hex ?? null
}

/** Hex warna garis tepi gambar (entri palet kode `0`). */
export function outlineColor(artwork: Artwork): string {
  return artwork.palette.find((entry) => entry.code === OUTLINE_CODE)?.hex ?? OUTLINE_COLOR
}

/**
 * Kotak yang dihitung untuk persen:
 * - mode 'number': semua kotak non-latar (termasuk garis tepi, yang juga diwarnai)
 * - mode 'free': kotak non-latar dan bukan garis tepi
 */
function countsTowardPercent(artwork: Artwork, index: number, mode: ColoringMode): boolean {
  if (isBackground(artwork, index)) return false
  return mode === 'number' || !isOutline(artwork, index)
}

function isDone(artwork: Artwork, colors: PixelColors, index: number, mode: ColoringMode): boolean {
  const color = colors[index]
  if (color == null) return false
  return mode === 'free' || color.toLowerCase() === referenceColor(artwork, index)
}

/**
 * Persen (0-100, dibulatkan).
 * - mode 'number': kotak dengan warna benar (sama dengan kodenya) / semua kotak non-latar
 * - mode 'free' (bawaan): kotak non-latar & non-garis yang sudah diwarnai / jumlah kotak itu
 */
export function computePercent(
  artwork: Artwork,
  colors: PixelColors,
  mode: ColoringMode = 'free',
): number {
  let total = 0
  let done = 0
  artwork.pixels.forEach((_, index) => {
    if (!countsTowardPercent(artwork, index, mode)) return
    total++
    if (isDone(artwork, colors, index, mode)) done++
  })
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

/**
 * Warna akhir satu kotak untuk ditampilkan.
 * - view 'reference': warna contoh (latar = EMPTY_COLOR)
 * - mode 'free' (bawaan): garis tepi selalu hitam (terkunci); kotak lain warna user atau EMPTY_COLOR
 * - mode 'number': semua kotak memakai warna user atau EMPTY_COLOR (garis tepi juga diwarnai user)
 */
export function resolvePixelColor(
  artwork: Artwork,
  colors: PixelColors | undefined,
  index: number,
  view: PixelViewMode,
  mode: ColoringMode = 'free',
): string {
  if (view === 'reference') return referenceColor(artwork, index) ?? EMPTY_COLOR
  if (mode === 'free' && isOutline(artwork, index)) return outlineColor(artwork)
  return colors?.[index] ?? EMPTY_COLOR
}

/** Semua warna kotak untuk ditampilkan, panjang = width * height. */
export function resolveAllPixelColors(
  artwork: Artwork,
  colors: PixelColors | undefined,
  view: PixelViewMode,
  mode: ColoringMode = 'free',
): readonly string[] {
  return artwork.pixels.map((_, i) => resolvePixelColor(artwork, colors, i, view, mode))
}

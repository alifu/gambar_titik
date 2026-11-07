import type { Artwork } from '../types/artwork'

/** Warna garis tepi (outline) yang dipakai di galeri dan editor. */
export const OUTLINE_COLOR = '#2b2b2b'
/** Warna pixel yang belum diwarnai. */
export const EMPTY_COLOR = '#ffffff'

export type PixelViewMode = 'user' | 'reference'

/**
 * Warna akhir satu pixel untuk ditampilkan.
 * - outline selalu OUTLINE_COLOR
 * - mode 'reference' memakai warna contoh
 * - mode 'user' memakai warna user, atau EMPTY_COLOR jika belum diwarnai
 */
export function resolvePixelColor(
  artwork: Artwork,
  colors: readonly (string | null)[] | undefined,
  index: number,
  mode: PixelViewMode,
): string {
  if (artwork.outline[index]) return OUTLINE_COLOR
  if (mode === 'reference') return artwork.reference[index]
  return colors?.[index] ?? EMPTY_COLOR
}

/** Semua warna pixel untuk ditampilkan, panjang = width * height. */
export function resolveAllPixelColors(
  artwork: Artwork,
  colors: readonly (string | null)[] | undefined,
  mode: PixelViewMode,
): readonly string[] {
  return artwork.outline.map((_, i) => resolvePixelColor(artwork, colors, i, mode))
}

/** Persen (0-100, dibulatkan) pixel non-outline yang sudah diwarnai. */
export function computePercent(artwork: Artwork, colors: readonly (string | null)[]): number {
  const fillable = artwork.outline.filter((isOutline) => !isOutline).length
  if (fillable === 0) return 0
  const filled = artwork.outline.filter((isOutline, i) => !isOutline && colors[i] != null).length
  return Math.round((filled / fillable) * 100)
}

export type Category = 'scenery' | 'animal' | 'food'

/** Nilai `pixels` untuk kotak latar ("·"): tidak perlu diwarnai. */
export const BACKGROUND = -1
/** Kode warna garis tepi hitam. Selalu entri pertama palet. */
export const OUTLINE_CODE = '0'
/** Simbol kotak latar di lembar ber-kode. */
export const BACKGROUND_SYMBOL = '·'

/** Satu warna di legenda: kode (`0`–`9`, `A`–`Z`), nama Bahasa Indonesia, dan hex `#rrggbb`. */
export interface PaletteEntry {
  readonly code: string
  readonly name: string
  readonly hex: string
}

/** Satu gambar pixel art ber-kode. `pixels` panjangnya width * height, urutan baris demi baris. */
export interface Artwork {
  readonly id: string
  readonly title: string
  readonly category: Category
  readonly width: number
  readonly height: number
  /** ≤12 warna, `palette[0]` = kode `0` (hitam, garis tepi) */
  readonly palette: readonly PaletteEntry[]
  /** Indeks palet per kotak, `BACKGROUND` (-1) = latar */
  readonly pixels: readonly number[]
}

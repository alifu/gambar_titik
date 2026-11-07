export type Category = 'scenery' | 'animal' | 'food'

/** Satu gambar pixel art. Semua array panjangnya width * height, urutan baris demi baris. */
export interface Artwork {
  readonly id: string
  readonly title: string
  readonly category: Category
  readonly width: number
  readonly height: number
  /** true = pixel garis tepi (terkunci, tidak bisa diwarnai) */
  readonly outline: readonly boolean[]
  /** Warna contoh (hex `#rrggbb`) per pixel */
  readonly reference: readonly string[]
  /** Palet saran, maksimal 16 warna hex */
  readonly suggestedPalette: readonly string[]
}

/**
 * Format ringkas `public/data/artworks.json` (versi 2):
 * - `palette`: daftar `{ code, name, hex }` (≤12), entri pertama kode `0` (hitam)
 * - `rows`: satu teks per baris grid; tiap karakter = kode warna kotak, atau `.` untuk latar
 *
 * Contoh 3×2: `rows: ["0.1", "011"]`. Mudah dibaca (mirip lembar ber-kode) dan kecil setelah gzip.
 */
import { BACKGROUND, type Artwork, type Category, type PaletteEntry } from '../types/artwork.ts'

export const ARTWORK_DATA_VERSION = 2
export const MAX_PALETTE_COLORS = 12
/** Karakter latar di `rows`. */
export const BACKGROUND_CHAR = '.'

export interface EncodedArtwork {
  readonly id: string
  readonly title: string
  readonly category: Category
  readonly width: number
  readonly height: number
  readonly palette: readonly PaletteEntry[]
  readonly rows: readonly string[]
}

export interface ArtworkDataFile {
  readonly version: typeof ARTWORK_DATA_VERSION
  readonly artworks: readonly EncodedArtwork[]
}

export class ArtworkDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ArtworkDataError'
  }
}

/** Ubah indeks palet per kotak menjadi baris teks ber-kode. */
export function encodeRows(artwork: Artwork): string[] {
  const { width, height, palette, pixels } = artwork
  const charOf = (value: number): string => {
    if (value === BACKGROUND) return BACKGROUND_CHAR
    const entry = palette[value]
    if (entry === undefined) throw new ArtworkDataError(`Indeks palet ${value} tidak ada`)
    return entry.code
  }
  return Array.from({ length: height }, (_, y) =>
    pixels
      .slice(y * width, (y + 1) * width)
      .map(charOf)
      .join(''),
  )
}

export function encodeArtwork(artwork: Artwork): EncodedArtwork {
  const { id, title, category, width, height, palette } = artwork
  return { id, title, category, width, height, palette, rows: encodeRows(artwork) }
}

export function encodeArtworks(artworks: readonly Artwork[]): ArtworkDataFile {
  return { version: ARTWORK_DATA_VERSION, artworks: artworks.map(encodeArtwork) }
}

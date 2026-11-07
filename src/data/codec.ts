/**
 * Format ringkas `public/data/artworks.json`:
 * - `palette`: warna hex (≤16) = `suggestedPalette`
 * - `reference`: RLE pasangan [indeksPalet, panjang, indeksPalet, panjang, ...]
 * - `outline`: RLE panjang run bergantian, dimulai dari run `false`
 */
import type { Artwork, Category } from '../types/artwork.ts'

export const ARTWORK_DATA_VERSION = 1
export const MAX_PALETTE_COLORS = 16

export interface EncodedArtwork {
  readonly id: string
  readonly title: string
  readonly category: Category
  readonly width: number
  readonly height: number
  readonly palette: readonly string[]
  readonly reference: readonly number[]
  readonly outline: readonly number[]
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

function encodeRuns<T>(values: readonly T[], emit: (value: T, length: number) => void): void {
  let start = 0
  for (let index = 1; index <= values.length; index++) {
    if (index === values.length || values[index] !== values[start]) {
      emit(values[start], index - start)
      start = index
    }
  }
}

export function encodeOutline(outline: readonly boolean[]): number[] {
  const runs: number[] = []
  if (outline[0] === true) runs.push(0)
  encodeRuns(outline, (_, length) => runs.push(length))
  return runs
}

export function encodeReference(
  reference: readonly string[],
  palette: readonly string[],
): number[] {
  const runs: number[] = []
  encodeRuns(reference, (color, length) => {
    const index = palette.indexOf(color)
    if (index < 0) throw new ArtworkDataError(`Warna ${color} tidak ada di palet`)
    runs.push(index, length)
  })
  return runs
}

export function encodeArtwork(artwork: Artwork): EncodedArtwork {
  const { id, title, category, width, height, suggestedPalette } = artwork
  return {
    id,
    title,
    category,
    width,
    height,
    palette: suggestedPalette,
    reference: encodeReference(artwork.reference, suggestedPalette),
    outline: encodeOutline(artwork.outline),
  }
}

export function encodeArtworks(artworks: readonly Artwork[]): ArtworkDataFile {
  return { version: ARTWORK_DATA_VERSION, artworks: artworks.map(encodeArtwork) }
}

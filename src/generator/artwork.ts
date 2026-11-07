import type { Artwork, Category } from '../types/artwork.ts'
import { buildOutline } from './outline.ts'
import { quantizeColors, rankColors } from './quantize.ts'
import type { Raster } from './raster.ts'

export interface ArtworkMeta {
  readonly id: string
  readonly title: string
  readonly category: Category
}

/** Pasca-proses raster: kuantisasi palet, gabung region kecil, buat garis tepi. */
export function createArtwork(meta: ArtworkMeta, raster: Raster): Artwork {
  const quantized: Raster = { ...raster, colors: quantizeColors(raster.colors) }
  const { raster: finalRaster, outline } = buildOutline(quantized)
  return {
    ...meta,
    width: raster.width,
    height: raster.height,
    outline,
    reference: finalRaster.colors,
    suggestedPalette: rankColors(finalRaster.colors),
  }
}

import {
  BACKGROUND,
  OUTLINE_CODE,
  type Artwork,
  type Category,
  type PaletteEntry,
} from '../types/artwork.ts'
import { nameColors, OUTLINE_NAME } from './colorNames.ts'
import {
  absorbSmallDetails,
  EDGE_CONTRAST,
  OUTLINE_HEX,
  removeIslands,
  traceOutline,
  type Cell,
} from './outline.ts'
import { MAX_PALETTE_SIZE, rankColors, reducePalette } from './quantize.ts'
import type { Raster } from './raster.ts'

/** Kode warna setelah `0` (hitam), urut dari warna yang paling sering. */
export const COLOR_CODES = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export interface ArtworkMeta {
  readonly id: string
  readonly title: string
  readonly category: Category
}

/** Palet ber-kode: hitam (`0`) lalu warna lain dari yang paling sering. */
export function buildPalette(cells: readonly Cell[]): PaletteEntry[] {
  const ranked = rankColors(cells)
  const names = nameColors(ranked)
  return [
    { code: OUTLINE_CODE, name: OUTLINE_NAME, hex: OUTLINE_HEX },
    ...ranked.map((hex, index) => ({ code: COLOR_CODES[index], name: names[index], hex })),
  ]
}

/** Pasca-proses raster: buang detail kecil, garis tepi hitam, kurangi warna, buang pulau kecil, lalu beri kode. */
export interface ArtworkOptions {
  /** Kontras minimal (ΔE) antar-warna yang diberi garis tepi. */
  readonly edgeContrast: number
  /** Jumlah warna maksimal termasuk hitam. */
  readonly maxColors: number
}

const DEFAULT_OPTIONS: ArtworkOptions = { edgeContrast: EDGE_CONTRAST, maxColors: MAX_PALETTE_SIZE }

export function createArtwork(
  meta: ArtworkMeta,
  raster: Raster,
  options: ArtworkOptions = DEFAULT_OPTIONS,
): Artwork {
  const { width, height } = raster
  const outlined = traceOutline(absorbSmallDetails(raster), options.edgeContrast)
  const cells = removeIslands(reducePalette(outlined, options.maxColors), width, height)
  const palette = buildPalette(cells)
  const indexOf = new Map(palette.map((entry, index) => [entry.hex, index]))
  return {
    ...meta,
    width,
    height,
    palette,
    pixels: cells.map((cell) => (cell === null ? BACKGROUND : (indexOf.get(cell) as number))),
  }
}

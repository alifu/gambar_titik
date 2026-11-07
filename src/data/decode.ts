import {
  BACKGROUND,
  OUTLINE_CODE,
  type Artwork,
  type Category,
  type PaletteEntry,
} from '../types/artwork.ts'
import {
  ARTWORK_DATA_VERSION,
  ArtworkDataError,
  BACKGROUND_CHAR,
  MAX_PALETTE_COLORS,
} from './codec.ts'

const MAX_DIMENSION = 256
const HEX_PATTERN = /^#[0-9a-f]{6}$/
const CODE_PATTERN = /^[0-9A-Z]$/
const CATEGORIES: readonly string[] = ['scenery', 'animal', 'food'] satisfies Category[]

type Fields = Record<string, unknown>

function fail(where: string, problem: string): never {
  throw new ArtworkDataError(`Data gambar rusak (${where}): ${problem}.`)
}

function isRecord(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCount(value: unknown, min: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function requireText(fields: Fields, key: string, where: string): string {
  const value = fields[key]
  if (!isText(value)) fail(where, `${key} harus berupa teks`)
  return value
}

function requireDimension(fields: Fields, key: string, where: string): number {
  const value = fields[key]
  if (!isCount(value, 1) || value > MAX_DIMENSION)
    fail(where, `${key} harus bilangan bulat 1–${MAX_DIMENSION}`)
  return value
}

function toEntry(value: unknown, where: string): PaletteEntry {
  if (!isRecord(value)) fail(where, 'entri palet bukan objek')
  const { code, name, hex } = value
  if (typeof code !== 'string' || !CODE_PATTERN.test(code))
    fail(where, 'kode warna harus 0–9 atau A–Z')
  if (!isText(name)) fail(where, `nama warna kode ${code} kosong`)
  if (typeof hex !== 'string' || !HEX_PATTERN.test(hex))
    fail(where, `warna kode ${code} harus hex #rrggbb`)
  return { code, name, hex }
}

function requirePalette(value: unknown, where: string): PaletteEntry[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_PALETTE_COLORS)
    fail(where, `palet harus berisi 1–${MAX_PALETTE_COLORS} warna`)
  const palette = value.map((entry) => toEntry(entry, where))
  if (palette[0].code !== OUTLINE_CODE)
    fail(where, `warna pertama palet harus kode ${OUTLINE_CODE}`)
  if (new Set(palette.map((entry) => entry.code)).size !== palette.length)
    fail(where, 'kode warna di palet tidak boleh sama')
  return palette
}

function decodeRows(
  value: unknown,
  palette: readonly PaletteEntry[],
  width: number,
  height: number,
  where: string,
): number[] {
  if (!Array.isArray(value) || value.length !== height)
    fail(where, `rows harus berisi ${height} baris`)
  const indexOf = new Map(palette.map((entry, index) => [entry.code, index]))
  indexOf.set(BACKGROUND_CHAR, BACKGROUND)
  return value.flatMap((row: unknown, y) => {
    if (typeof row !== 'string' || row.length !== width)
      fail(where, `baris ke-${y + 1} harus ${width} karakter`)
    return [...row].map((char) => {
      const index = indexOf.get(char)
      if (index === undefined) fail(where, `kode "${char}" di baris ke-${y + 1} tidak ada di palet`)
      return index
    })
  })
}

function decodeArtwork(value: unknown, position: number): Artwork {
  const where = `gambar ke-${position + 1}`
  if (!isRecord(value)) fail(where, 'bukan objek')
  const id = requireText(value, 'id', where)
  const at = `${where}, ${id}`
  const category = value.category
  if (typeof category !== 'string' || !CATEGORIES.includes(category))
    fail(at, 'kategori tidak dikenal')
  const width = requireDimension(value, 'width', at)
  const height = requireDimension(value, 'height', at)
  const palette = requirePalette(value.palette, at)
  return {
    id,
    title: requireText(value, 'title', at),
    category: category as Category,
    width,
    height,
    palette,
    pixels: decodeRows(value.rows, palette, width, height, at),
  }
}

/** Ubah isi JSON (belum tepercaya) menjadi daftar Artwork, atau lempar ArtworkDataError. */
export function decodeArtworks(data: unknown): Artwork[] {
  if (!isRecord(data)) fail('berkas', 'bukan objek JSON')
  if (data.version !== ARTWORK_DATA_VERSION)
    fail('berkas', `versi data harus ${ARTWORK_DATA_VERSION}`)
  if (!Array.isArray(data.artworks)) fail('berkas', 'daftar gambar tidak ditemukan')
  const artworks = data.artworks.map(decodeArtwork)
  const ids = new Set(artworks.map((artwork) => artwork.id))
  if (ids.size !== artworks.length) fail('berkas', 'ada ID gambar yang sama')
  return artworks
}

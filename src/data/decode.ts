import type { Artwork, Category } from '../types/artwork.ts'
import { ARTWORK_DATA_VERSION, ArtworkDataError, MAX_PALETTE_COLORS } from './codec.ts'

const MAX_DIMENSION = 256
const HEX_PATTERN = /^#[0-9a-f]{6}$/
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

function requireText(fields: Fields, key: string, where: string): string {
  const value = fields[key]
  if (typeof value !== 'string' || value.trim() === '') fail(where, `${key} harus berupa teks`)
  return value
}

function requireDimension(fields: Fields, key: string, where: string): number {
  const value = fields[key]
  if (!isCount(value, 1) || value > MAX_DIMENSION)
    fail(where, `${key} harus bilangan bulat 1–${MAX_DIMENSION}`)
  return value
}

function requirePalette(value: unknown, where: string): string[] {
  const valid =
    Array.isArray(value) &&
    value.length >= 1 &&
    value.length <= MAX_PALETTE_COLORS &&
    value.every((color) => typeof color === 'string' && HEX_PATTERN.test(color))
  if (!valid) fail(where, `palet harus berisi 1–${MAX_PALETTE_COLORS} warna hex`)
  return value as string[]
}

function decodeReference(
  value: unknown,
  palette: readonly string[],
  size: number,
  where: string,
): string[] {
  if (!Array.isArray(value) || value.length % 2 !== 0)
    fail(where, 'reference harus pasangan indeks dan panjang')
  const colors: string[] = []
  for (let index = 0; index < value.length; index += 2) {
    const [colorIndex, length] = [value[index], value[index + 1]]
    if (!isCount(colorIndex, 0) || colorIndex >= palette.length)
      fail(where, 'indeks warna di luar palet')
    if (!isCount(length, 1) || colors.length + length > size)
      fail(where, 'panjang reference tidak sesuai ukuran')
    for (let step = 0; step < length; step++) colors.push(palette[colorIndex])
  }
  if (colors.length !== size) fail(where, 'panjang reference tidak sesuai ukuran')
  return colors
}

function decodeOutline(value: unknown, size: number, where: string): boolean[] {
  if (!Array.isArray(value)) fail(where, 'outline harus berupa daftar angka')
  const outline: boolean[] = []
  value.forEach((length: unknown, run) => {
    if (!isCount(length, 0) || outline.length + length > size)
      fail(where, 'panjang outline tidak sesuai ukuran')
    for (let step = 0; step < length; step++) outline.push(run % 2 === 1)
  })
  if (outline.length !== size) fail(where, 'panjang outline tidak sesuai ukuran')
  return outline
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
    outline: decodeOutline(value.outline, width * height, at),
    reference: decodeReference(value.reference, palette, width * height, at),
    suggestedPalette: palette,
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

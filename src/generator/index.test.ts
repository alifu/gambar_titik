import { beforeAll, describe, expect, it } from 'vitest'
import { BACKGROUND, OUTLINE_CODE, type Artwork } from '../types/artwork'
import { buildPalette, COLOR_CODES, createArtwork } from './artwork'
import { isHexColor } from './color'
import { DEFAULT_SEED, generateAllArtworks } from './index'
import { MIN_ISLAND, OUTLINE_HEX } from './outline'
import { MAX_PALETTE_SIZE } from './quantize'
import { fill, paint, rect, render } from './raster'
import { labelRegions } from './regions'

/** Subjek hewan & makanan menutup minimal ±30% grid (es krim yang ramping pun). */
const MAX_BACKGROUND_SHARE = 0.8
const GENERATE_TIMEOUT = 30000
const SIZES = { scenery: [48, 40], animal: [40, 40], food: [40, 40] } as const

/** Ukuran region warna (bukan hitam, bukan latar) terkecil. */
function smallestColorRegion(artwork: Artwork): number {
  const { pixels, width, height } = artwork
  const { sizes } = labelRegions(
    width,
    height,
    (i) => pixels[i] > 0,
    (a, b) => pixels[a] === pixels[b],
  )
  return Math.min(...sizes)
}

describe('generateAllArtworks', () => {
  let artworks: Artwork[]

  beforeAll(() => {
    artworks = generateAllArtworks()
  }, GENERATE_TIMEOUT)

  it('menghasilkan tepat 100 gambar dengan distribusi 34/33/33', () => {
    expect(artworks).toHaveLength(100)
    const count = (category: string) =>
      artworks.filter((artwork) => artwork.category === category).length
    expect([count('scenery'), count('animal'), count('food')]).toEqual([34, 33, 33])
  })

  it('ID dan judul unik, ID berpola stabil', () => {
    expect(new Set(artworks.map((artwork) => artwork.id)).size).toBe(100)
    expect(new Set(artworks.map((artwork) => artwork.title)).size).toBe(100)
    artworks.forEach((artwork) =>
      expect(artwork.id).toMatch(/^(scenery|animal|food)-[a-z-]+-\d{2}$/),
    )
    expect(artworks.map((artwork) => artwork.id)).toContain('animal-cat-01')
  })

  it('ukuran sesuai kategori dan indeks palet valid', () => {
    artworks.forEach((artwork) => {
      const [width, height] = SIZES[artwork.category]
      expect([artwork.width, artwork.height]).toEqual([width, height])
      expect(artwork.pixels).toHaveLength(width * height)
      const valid = artwork.pixels.every(
        (value) =>
          value === BACKGROUND ||
          (Number.isInteger(value) && value >= 0 && value < artwork.palette.length),
      )
      expect(valid).toBe(true)
    })
  })

  it('palet ≤12, kode unik berurutan, kode 0 = hitam, nama & hex valid dan unik', () => {
    artworks.forEach((artwork) => {
      const { palette } = artwork
      expect(palette.length).toBeLessThanOrEqual(MAX_PALETTE_SIZE)
      expect(palette.length).toBeGreaterThanOrEqual(3)
      expect(palette[0]).toEqual({ code: OUTLINE_CODE, name: 'Hitam', hex: OUTLINE_HEX })
      expect(palette.slice(1).map((entry) => entry.code)).toEqual([
        ...COLOR_CODES.slice(0, palette.length - 1),
      ])
      expect(palette.every((entry) => isHexColor(entry.hex) && entry.name.trim() !== '')).toBe(true)
      expect(new Set(palette.map((entry) => entry.name)).size).toBe(palette.length)
      expect(new Set(palette.map((entry) => entry.hex)).size).toBe(palette.length)
    })
  })

  it('semua warna palet terpakai, urut dari yang paling sering (setelah hitam)', () => {
    artworks.forEach((artwork) => {
      const counts = artwork.palette.map(
        (_, index) => artwork.pixels.filter((value) => value === index).length,
      )
      expect(counts.every((count) => count > 0)).toBe(true)
      const rest = counts.slice(1)
      expect(rest).toEqual([...rest].sort((a, b) => b - a))
    })
  })

  it('pemandangan tanpa latar; hewan & makanan punya latar dan subjek yang besar', () => {
    artworks.forEach((artwork) => {
      const background = artwork.pixels.filter((value) => value === BACKGROUND).length
      if (artwork.category === 'scenery') {
        expect(background).toBe(0)
        return
      }
      expect(background).toBeGreaterThan(0)
      expect(background / artwork.pixels.length).toBeLessThan(MAX_BACKGROUND_SHARE)
    })
  })

  it('tidak ada pulau warna yang terlalu kecil', () => {
    artworks.forEach((artwork) => {
      expect(smallestColorRegion(artwork)).toBeGreaterThanOrEqual(MIN_ISLAND)
    })
  })

  it(
    'deterministik: seed sama → hasil identik, seed lain → berbeda',
    () => {
      expect(generateAllArtworks(DEFAULT_SEED)).toEqual(artworks)
      expect(generateAllArtworks(DEFAULT_SEED + 1)).not.toEqual(artworks)
    },
    GENERATE_TIMEOUT,
  )
})

describe('createArtwork', () => {
  it('membuat palet ber-kode dan indeks per kotak dari raster', () => {
    const raster = render(6, 6, [paint(rect(2, 2, 4, 4), '#ff0000')])
    const artwork = createArtwork({ id: 'food-x-01', title: 'X', category: 'food' }, raster)
    expect(artwork.palette.map((entry) => entry.code)).toEqual(['0', '1'])
    expect(artwork.pixels[0]).toBe(BACKGROUND)
    expect(artwork.pixels[14]).toBe(1)
    expect(artwork.pixels.filter((value) => value === 0).length).toBeGreaterThan(0)
  })

  it('buildPalette selalu diawali hitam walau tidak dipakai', () => {
    const raster = render(2, 2, [fill('#ffffff')])
    expect(buildPalette(raster.colors)).toEqual([
      { code: '0', name: 'Hitam', hex: OUTLINE_HEX },
      { code: '1', name: 'Putih', hex: '#ffffff' },
    ])
  })
})

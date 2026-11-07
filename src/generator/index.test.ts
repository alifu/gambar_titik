import { beforeAll, describe, expect, it } from 'vitest'
import type { Artwork } from '../types/artwork'
import { isHexColor } from './color'
import { DEFAULT_SEED, generateAllArtworks } from './index'
import { MIN_REGION_SIZE } from './outline'
import { labelRegions } from './regions'

const SIZES = { scenery: [96, 64], animal: [64, 64], food: [64, 64] } as const

function regionStats(artwork: Artwork) {
  const { labels, sizes } = labelRegions(
    artwork.width,
    artwork.height,
    (index) => !artwork.outline[index],
    () => true,
  )
  const colorsPerRegion = new Map<number, Set<string>>()
  labels.forEach((label, index) => {
    if (label < 0) return
    const set = colorsPerRegion.get(label) ?? new Set<string>()
    set.add(artwork.reference[index])
    colorsPerRegion.set(label, set)
  })
  return { sizes, maxColors: Math.max(...[...colorsPerRegion.values()].map((set) => set.size)) }
}

describe('generateAllArtworks', () => {
  let artworks: Artwork[]

  beforeAll(() => {
    artworks = generateAllArtworks()
  })

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

  it('ukuran sesuai kategori dan semua array lengkap', () => {
    artworks.forEach((artwork) => {
      const [width, height] = SIZES[artwork.category]
      expect([artwork.width, artwork.height]).toEqual([width, height])
      expect(artwork.outline).toHaveLength(width * height)
      expect(artwork.reference).toHaveLength(width * height)
    })
  })

  it('warna hex valid dan palet ≤ 16 berisi semua warna contoh', () => {
    artworks.forEach((artwork) => {
      expect(artwork.suggestedPalette.length).toBeLessThanOrEqual(16)
      expect(artwork.suggestedPalette.every(isHexColor)).toBe(true)
      expect(new Set(artwork.suggestedPalette).size).toBe(artwork.suggestedPalette.length)
      const palette = new Set(artwork.suggestedPalette)
      expect(artwork.reference.every((color) => palette.has(color))).toBe(true)
    })
  })

  it('outline tidak kosong, region ≥ 4 pixel, dan tiap region satu warna', () => {
    artworks.forEach((artwork) => {
      expect(artwork.outline.some(Boolean)).toBe(true)
      const { sizes, maxColors } = regionStats(artwork)
      expect(sizes.length).toBeGreaterThan(3)
      expect(Math.min(...sizes)).toBeGreaterThanOrEqual(MIN_REGION_SIZE)
      expect(maxColors).toBe(1)
    })
  })

  it('deterministik: seed sama → hasil identik, seed lain → berbeda', () => {
    expect(generateAllArtworks(DEFAULT_SEED)).toEqual(artworks)
    expect(generateAllArtworks(DEFAULT_SEED + 1)).not.toEqual(artworks)
  })
})

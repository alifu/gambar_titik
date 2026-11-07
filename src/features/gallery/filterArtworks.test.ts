import { describe, expect, it } from 'vitest'
import { makeProgress, TEST_ARTWORKS } from '../../test/galleryFixtures'
import {
  DEFAULT_FILTERS,
  filterArtworks,
  getArtworkStatus,
  normalizeText,
  type GalleryFilters,
} from './filterArtworks'

const progress = new Map([
  ['animal-1', makeProgress('animal-1', 45)],
  ['scenery-1', makeProgress('scenery-1', 100)],
  ['food-1', makeProgress('food-1', 30, true)],
  ['animal-2', makeProgress('animal-2', 0)],
])
const ids = (filters: Partial<GalleryFilters>) =>
  filterArtworks(TEST_ARTWORKS, progress, { ...DEFAULT_FILTERS, ...filters }).map((a) => a.id)

describe('filterArtworks', () => {
  it('returns everything with default filters', () => {
    expect(ids({})).toHaveLength(4)
  })

  it('filters by category', () => {
    expect(ids({ category: 'animal' })).toEqual(['animal-1', 'animal-2'])
  })

  it('searches titles case-insensitively and ignoring accents', () => {
    expect(ids({ query: 'CAFE' })).toEqual(['food-1'])
    expect(ids({ query: ' kucing ' })).toEqual(['animal-1'])
    expect(ids({ query: 'zzz' })).toEqual([])
  })

  it('filters in-progress artworks', () => {
    expect(ids({ status: 'inProgress' })).toEqual(['animal-1'])
  })

  it('filters done artworks by 100 percent or completed flag', () => {
    expect(ids({ status: 'done' })).toEqual(['scenery-1', 'food-1'])
  })

  it('combines category, status and query', () => {
    expect(ids({ category: 'animal', status: 'inProgress', query: 'kuc' })).toEqual(['animal-1'])
    expect(ids({ category: 'food', status: 'inProgress' })).toEqual([])
  })
})

describe('getArtworkStatus', () => {
  it('classifies progress', () => {
    expect(getArtworkStatus(undefined)).toBe('new')
    expect(getArtworkStatus(makeProgress('a', 0))).toBe('new')
    expect(getArtworkStatus(makeProgress('a', 10))).toBe('inProgress')
    expect(getArtworkStatus(makeProgress('a', 100))).toBe('done')
  })
})

describe('normalizeText', () => {
  it('lowercases and strips accents', () => {
    expect(normalizeText(' Café ')).toBe('cafe')
  })
})

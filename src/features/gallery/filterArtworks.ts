import type { Artwork, Category } from '../../types/artwork'
import type { Progress } from '../../types/progress'

export type StatusFilter = 'all' | 'inProgress' | 'done'
export type CategoryFilter = Category | 'all'
export type ArtworkStatus = 'new' | 'inProgress' | 'done'

export interface GalleryFilters {
  readonly category: CategoryFilter
  readonly status: StatusFilter
  readonly query: string
}

export const DEFAULT_FILTERS: GalleryFilters = { category: 'all', status: 'all', query: '' }

/** Huruf kecil dan tanpa aksen, untuk pencarian. */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

export function getArtworkStatus(progress: Progress | undefined): ArtworkStatus {
  if (!progress) return 'new'
  if (progress.completed || progress.percent >= 100) return 'done'
  return progress.percent > 0 ? 'inProgress' : 'new'
}

export function filterArtworks(
  artworks: readonly Artwork[],
  progressByArt: ReadonlyMap<string, Progress>,
  filters: GalleryFilters,
): readonly Artwork[] {
  const query = normalizeText(filters.query)
  return artworks.filter((artwork) => {
    if (filters.category !== 'all' && artwork.category !== filters.category) return false
    if (query && !normalizeText(artwork.title).includes(query)) return false
    if (filters.status === 'all') return true
    return getArtworkStatus(progressByArt.get(artwork.id)) === filters.status
  })
}

import { ID } from '../../i18n/id'
import type { CategoryFilter, GalleryFilters, StatusFilter } from './filterArtworks'

interface GalleryFilterBarProps {
  readonly filters: GalleryFilters
  readonly onChange: (patch: Partial<GalleryFilters>) => void
}

const CATEGORIES: readonly CategoryFilter[] = ['all', 'scenery', 'animal', 'food']
const STATUSES: readonly StatusFilter[] = ['all', 'inProgress', 'done']

export function GalleryFilterBar({ filters, onChange }: GalleryFilterBarProps) {
  return (
    <div className="gallery-filters">
      <label className="gallery-search">
        <span className="gallery-visually-hidden">{ID.gallery.searchLabel}</span>
        <input
          type="search"
          value={filters.query}
          placeholder={ID.gallery.searchLabel}
          onChange={(event) => onChange({ query: event.target.value })}
        />
      </label>
      <div className="gallery-chips" role="group" aria-label={ID.gallery.categoryGroup}>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className="gallery-chip"
            aria-pressed={filters.category === category}
            onClick={() => onChange({ category })}
          >
            {ID.gallery.categories[category]}
          </button>
        ))}
      </div>
      <div className="gallery-chips" role="group" aria-label={ID.gallery.statusGroup}>
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className="gallery-chip"
            aria-pressed={filters.status === status}
            onClick={() => onChange({ status })}
          >
            {ID.gallery.statuses[status]}
          </button>
        ))}
      </div>
    </div>
  )
}

import { useArtworks } from '../../data/useArtworks'
import { ID } from '../../i18n/id'
import { useSession } from '../../user/useSession'
import { ArtworkCard } from './ArtworkCard'
import { filterArtworks } from './filterArtworks'
import { GalleryFilterBar } from './GalleryFilterBar'
import { useGalleryFilters } from './useGalleryFilters'
import { useUserProgress } from './useUserProgress'

export function GalleryPage() {
  const user = useSession((s) => s.currentUser)
  const artworksState = useArtworks()
  const progress = useUserProgress(user?.id)
  const [filters, updateFilters] = useGalleryFilters()

  const error = artworksState.error ?? progress.error
  const retry = () => {
    if (artworksState.error) artworksState.retry()
    if (progress.error) progress.retry()
  }

  return (
    <section className="gallery">
      <h1>{ID.gallery.title}</h1>
      {error ? (
        <div role="alert" className="gallery-message">
          <p>{error}</p>
          <button type="button" onClick={retry}>
            {ID.gallery.retry}
          </button>
        </div>
      ) : artworksState.status === 'loading' ? (
        <p role="status" className="gallery-message">
          {ID.gallery.loading}
        </p>
      ) : (
        <GalleryContent
          artworks={filterArtworks(artworksState.artworks, progress.progressByArt, filters)}
          progressByArt={progress.progressByArt}
          filterBar={<GalleryFilterBar filters={filters} onChange={updateFilters} />}
        />
      )}
    </section>
  )
}

interface GalleryContentProps {
  readonly artworks: ReturnType<typeof filterArtworks>
  readonly progressByArt: ReturnType<typeof useUserProgress>['progressByArt']
  readonly filterBar: React.ReactNode
}

function GalleryContent({ artworks, progressByArt, filterBar }: GalleryContentProps) {
  return (
    <>
      {filterBar}
      {artworks.length === 0 ? (
        <p role="status" className="gallery-message">
          {ID.gallery.empty}
        </p>
      ) : (
        <ul className="gallery-grid">
          {artworks.map((artwork) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              progress={progressByArt.get(artwork.id)}
            />
          ))}
        </ul>
      )}
    </>
  )
}

import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ArtworkThumbnail } from '../../components/ArtworkThumbnail'
import { ID } from '../../i18n/id'
import type { Artwork } from '../../types/artwork'
import type { Progress } from '../../types/progress'
import { getArtworkStatus } from './filterArtworks'

interface ArtworkCardProps {
  readonly artwork: Artwork
  readonly progress: Progress | undefined
}

function badgeText(progress: Progress | undefined): string | null {
  const status = getArtworkStatus(progress)
  if (status === 'done') return ID.gallery.done
  if (status === 'inProgress' && progress) return `${progress.percent}%`
  return null
}

function ArtworkCardBase({ artwork, progress }: ArtworkCardProps) {
  const badge = badgeText(progress)
  return (
    <li className="gallery-card">
      <Link to={`/warnai/${artwork.id}`} className="gallery-card-link">
        <ArtworkThumbnail artwork={artwork} colors={progress?.colors} />
        <span className="gallery-card-title">{artwork.title}</span>
        {badge && <span className="gallery-badge">{badge}</span>}
      </Link>
      <Link
        to={`/cetak/${artwork.id}`}
        className="gallery-card-print"
        aria-label={ID.print.linkLabel(artwork.title)}
      >
        {ID.print.link}
      </Link>
    </li>
  )
}

export const ArtworkCard = memo(ArtworkCardBase)

import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ArtworkThumbnail } from '../../components/ArtworkThumbnail'
import { editorPath } from '../../editor/modeParam'
import { ID } from '../../i18n/id'
import type { Artwork } from '../../types/artwork'
import type { ColoringMode, Progress } from '../../types/progress'
import { getArtworkStatus } from './filterArtworks'

interface ArtworkCardProps {
  readonly artwork: Artwork
  readonly progress: Progress | undefined
}

function badgeText(progress: Progress | undefined): string | null {
  const status = getArtworkStatus(progress)
  if (status === 'done') return ID.gallery.done
  if (status === 'inProgress' && progress) {
    return `${ID.gallery.modeShort[progress.mode]} ${progress.percent}%`
  }
  return null
}

const CARD_MODES: readonly ColoringMode[] = ['number', 'free']

function ArtworkCardBase({ artwork, progress }: ArtworkCardProps) {
  const badge = badgeText(progress)
  return (
    <li className="gallery-card">
      <Link to={editorPath(artwork.id)} className="gallery-card-link">
        <ArtworkThumbnail artwork={artwork} colors={progress?.colors} mode={progress?.mode} />
        <span className="gallery-card-title">{artwork.title}</span>
        {badge && <span className="gallery-badge">{badge}</span>}
      </Link>
      <div
        className="gallery-card-modes"
        role="group"
        aria-label={ID.mode.cardGroup(artwork.title)}
      >
        {CARD_MODES.map((mode) => (
          <Link
            key={mode}
            to={editorPath(artwork.id, mode)}
            className="gallery-card-mode"
            aria-label={ID.mode.cardLink(artwork.title, ID.mode[mode])}
          >
            {ID.mode[mode]}
          </Link>
        ))}
      </div>
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

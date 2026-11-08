import { memo, useEffect, useRef } from 'react'
import { resolveAllPixelColors } from '../render/pixelColors'
import type { Artwork } from '../types/artwork'
import type { ColoringMode } from '../types/progress'

interface ArtworkThumbnailProps {
  readonly artwork: Artwork
  /** Warna user; undefined = belum ada progres (hanya outline). */
  readonly colors?: readonly (string | null)[]
  /** Mode progres: 'number' menggambar garis tepi sesuai warna user, bukan hitam terkunci. */
  readonly mode?: ColoringMode
}

const HEX_PARTS = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i

function toPixelData(hexColors: readonly string[], data: Uint8ClampedArray): void {
  hexColors.forEach((hex, i) => {
    const match = HEX_PARTS.exec(hex)
    if (!match) return
    data[i * 4] = parseInt(match[1], 16)
    data[i * 4 + 1] = parseInt(match[2], 16)
    data[i * 4 + 2] = parseInt(match[3], 16)
    data[i * 4 + 3] = 255
  })
}

function ArtworkThumbnailBase({ artwork, colors, mode = 'free' }: ArtworkThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d')
    if (!context) return
    const hexColors = resolveAllPixelColors(artwork, colors, 'user', mode)
    const image = context.createImageData(artwork.width, artwork.height)
    toPixelData(hexColors, image.data)
    context.putImageData(image, 0, 0)
  }, [artwork, colors, mode])

  return (
    <canvas
      ref={canvasRef}
      className="thumb"
      width={artwork.width}
      height={artwork.height}
      role="img"
      aria-label={artwork.title}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

export const ArtworkThumbnail = memo(ArtworkThumbnailBase)

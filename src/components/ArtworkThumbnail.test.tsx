import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OUTLINE_COLOR } from '../render/pixelColors'
import { TEST_ARTWORKS } from '../test/galleryFixtures'
import { ArtworkThumbnail } from './ArtworkThumbnail'

const artwork = TEST_ARTWORKS[0]

describe('ArtworkThumbnail', () => {
  afterEach(() => vi.restoreAllMocks())

  it('exposes the title as an accessible image label', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    render(<ArtworkThumbnail artwork={artwork} />)
    const canvas = screen.getByRole('img', { name: artwork.title })
    expect(canvas).toHaveStyle({ imageRendering: 'pixelated' })
    expect(canvas).toHaveAttribute('width', '2')
  })

  it('draws outline and user colors when a canvas context exists', () => {
    const putImageData = vi.fn()
    const image = { data: new Uint8ClampedArray(16) }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      createImageData: () => image,
      putImageData,
    } as unknown as CanvasRenderingContext2D)

    render(<ArtworkThumbnail artwork={artwork} colors={[null, '#ff0000', null, 'bukan-hex']} />)

    expect(putImageData).toHaveBeenCalledTimes(1)
    const outline = parseInt(OUTLINE_COLOR.slice(1, 3), 16)
    expect(Array.from(image.data.slice(0, 4))).toEqual([outline, outline, outline, 255])
    expect(Array.from(image.data.slice(4, 8))).toEqual([255, 0, 0, 255])
    expect(Array.from(image.data.slice(8, 12))).toEqual([255, 255, 255, 255])
    expect(Array.from(image.data.slice(12, 16))).toEqual([0, 0, 0, 0])
  })
})

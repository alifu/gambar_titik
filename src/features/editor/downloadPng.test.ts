import { afterEach, describe, expect, it, vi } from 'vitest'
import { emptyColors } from '../../editor/tools'
import { ID } from '../../i18n/id'
import { OUTLINE_COLOR } from '../../render/pixelColors'
import { TEST_ARTWORK as art } from '../../test/editorArtwork'
import { PNG_SCALE, pngFileName, renderPng } from './downloadPng'

describe('pngFileName', () => {
  it.each([
    ['Kucing Oranye', 'kucing-oranye.png'],
    ['  Café & Roti!! ', 'cafe-roti.png'],
    ['!!!', 'gambar.png'],
  ])('%s → %s', (title, expected) => {
    expect(pngFileName(title)).toBe(expected)
  })
})

describe('renderPng', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('menggambar setiap pixel diperbesar', async () => {
    const ctx = { fillStyle: '', fillRect: vi.fn() }
    const styles: string[] = []
    ctx.fillRect.mockImplementation(() => styles.push(ctx.fillStyle))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    )
    const blob = new Blob(['png'])
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(blob))
    await expect(renderPng(art, emptyColors(art))).resolves.toBe(blob)
    expect(ctx.fillRect).toHaveBeenCalledTimes(36)
    expect(ctx.fillRect).toHaveBeenCalledWith(PNG_SCALE * 2, 0, PNG_SCALE, PNG_SCALE)
    expect(styles[2]).toBe(OUTLINE_COLOR)
  })

  it('gagal jika toBlob tidak menghasilkan blob', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(null))
    await expect(renderPng(art, emptyColors(art))).rejects.toThrow(ID.editor.downloadFailed)
  })
})

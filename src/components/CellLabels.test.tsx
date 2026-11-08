import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CellLabels } from './CellLabels'

function fakeContext() {
  return {
    font: '',
    textAlign: '',
    textBaseline: '',
    fillStyle: '',
    clearRect: vi.fn(),
    fillText: vi.fn(),
  }
}

describe('CellLabels', () => {
  let ctx: ReturnType<typeof fakeContext>

  beforeEach(() => {
    ctx = fakeContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    )
    vi.stubGlobal('devicePixelRatio', 2)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('menggambar kode & titik latar, lalu hanya kotak yang berubah', async () => {
    const { rerender } = render(<CellLabels width={2} height={1} labels={['·', '3']} zoom={10} />)
    const canvas = screen.getByTestId('cell-labels')
    expect(canvas).toHaveAttribute('width', '48')
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
    await waitFor(() => expect(ctx.fillText).toHaveBeenCalledTimes(2))
    expect(ctx.fillText).toHaveBeenCalledWith('3', 36, 12)

    rerender(<CellLabels width={2} height={1} labels={['·', '']} zoom={10} />)
    await waitFor(() => expect(ctx.clearRect).toHaveBeenCalledTimes(3))
    expect(ctx.clearRect).toHaveBeenLastCalledWith(24, 0, 24, 24)
    expect(ctx.fillText).toHaveBeenCalledTimes(2)
  })

  it('resolusi berubah saat zoom berubah → semua kotak digambar ulang (dibatasi)', async () => {
    const { rerender } = render(<CellLabels width={1} height={1} labels={['1']} zoom={10} />)
    await waitFor(() => expect(ctx.fillText).toHaveBeenCalledTimes(1))
    rerender(<CellLabels width={1} height={1} labels={['1']} zoom={60} />)
    expect(screen.getByTestId('cell-labels')).toHaveAttribute('width', '40')
    await waitFor(() => expect(ctx.fillText).toHaveBeenCalledTimes(2))
    rerender(<CellLabels width={1} height={1} labels={['1']} zoom={1} />)
    expect(screen.getByTestId('cell-labels')).toHaveAttribute('width', '16')
  })

  it('aman jika getContext null', async () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null)
    const { unmount } = render(<CellLabels width={1} height={1} labels={['1']} zoom={10} />)
    await new Promise((resolve) => requestAnimationFrame(resolve))
    unmount()
    expect(ctx.fillText).not.toHaveBeenCalled()
  })
})

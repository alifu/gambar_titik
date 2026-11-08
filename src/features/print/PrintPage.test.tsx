import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getArtworkById } from '../../data/artworks'
import { ID } from '../../i18n/id'
import { BACKGROUND, BACKGROUND_SYMBOL, type Artwork } from '../../types/artwork'
import { PrintPage } from './PrintPage'

vi.mock('../../data/artworks', () => ({ getArtworkById: vi.fn() }))
const getArt = vi.mocked(getArtworkById)

const ARTWORK: Artwork = {
  id: 'test-1',
  title: 'Kucing Uji',
  category: 'animal',
  width: 3,
  height: 2,
  palette: [
    { code: '0', name: 'Hitam', hex: '#000000' },
    { code: '1', name: 'Merah', hex: '#ff0000' },
    { code: '2', name: 'Biru Langit', hex: '#00aaff' },
  ],
  pixels: [BACKGROUND, 0, 1, 2, 1, BACKGROUND],
}

function setup() {
  return render(
    <MemoryRouter initialEntries={['/cetak/test-1']}>
      <Routes>
        <Route path="/cetak/:artId" element={<PrintPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const cells = (container: HTMLElement) => container.querySelectorAll('[data-cell]')

describe('PrintPage', () => {
  beforeEach(() => getArt.mockReset())
  afterEach(() => vi.restoreAllMocks())

  it('shows loading then the sheet with title and heading', async () => {
    getArt.mockResolvedValue(ARTWORK)
    setup()
    expect(screen.getByText(ID.print.loading)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Kucing Uji' })).toBeInTheDocument()
    expect(screen.getByText(ID.print.sheetHeading)).toBeInTheDocument()
  })

  it('renders width*height cells with codes and dots for background', async () => {
    getArt.mockResolvedValue(ARTWORK)
    const { container } = setup()
    await screen.findByRole('heading', { name: 'Kucing Uji' })
    const all = Array.from(cells(container))
    expect(all).toHaveLength(6)
    expect(all.map((c) => c.textContent)).toEqual([
      BACKGROUND_SYMBOL,
      '0',
      '1',
      '2',
      '1',
      BACKGROUND_SYMBOL,
    ])
  })

  it('lists every palette entry in the legend', async () => {
    getArt.mockResolvedValue(ARTWORK)
    setup()
    const legend = await screen.findByRole('list', { name: ID.print.legend })
    expect(legend.querySelectorAll('li')).toHaveLength(3)
    expect(legend).toHaveTextContent('Biru Langit')
  })

  it('toggles the answer key page', async () => {
    getArt.mockResolvedValue(ARTWORK)
    const { container } = setup()
    await screen.findByRole('heading', { name: 'Kucing Uji' })
    expect(screen.queryByText(ID.print.answerKeyHeading)).not.toBeInTheDocument()
    await userEvent.click(screen.getByLabelText(ID.print.includeAnswerKey))
    expect(screen.getByText(ID.print.answerKeyHeading)).toBeInTheDocument()
    expect(cells(container)).toHaveLength(12)
    const keyRect = container.querySelector('.print-sheet--key [data-cell="2"] rect')
    expect(keyRect).toHaveAttribute('fill', '#ff0000')
    await userEvent.click(screen.getByLabelText(ID.print.includeAnswerKey))
    expect(screen.queryByText(ID.print.answerKeyHeading)).not.toBeInTheDocument()
  })

  it('calls window.print from the print button', async () => {
    getArt.mockResolvedValue(ARTWORK)
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    setup()
    await userEvent.click(await screen.findByRole('button', { name: ID.print.printButton }))
    expect(print).toHaveBeenCalledTimes(1)
  })

  it('shows not found with a link back to the gallery', async () => {
    getArt.mockResolvedValue(undefined)
    setup()
    expect(await screen.findByText(ID.print.notFound)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: ID.print.backToGallery })).toHaveAttribute(
      'href',
      '/galeri',
    )
  })

  it('shows the error and retries', async () => {
    getArt.mockRejectedValueOnce(new Error('Gagal total'))
    getArt.mockResolvedValue(ARTWORK)
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Gagal total')
    await userEvent.click(screen.getByRole('button', { name: ID.print.retry }))
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Kucing Uji' })).toBeInTheDocument(),
    )
  })

  it('falls back to a generic message when the rejection is not an Error', async () => {
    getArt.mockImplementationOnce(() => Promise.reject('bukan error' as unknown as Error))
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent(ID.editor.loadFailed)
  })
})

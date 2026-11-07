import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadArtworks } from '../../data/artworks'
import { ID } from '../../i18n/id'
import { clearAllForTests, listProgress, saveProgress } from '../../storage/repository'
import { makeProgress, TEST_ARTWORKS } from '../../test/galleryFixtures'
import { useSession } from '../../user/useSession'
import { GalleryPage } from './GalleryPage'

vi.mock('../../data/artworks', () => ({ loadArtworks: vi.fn() }))
vi.mock('../../storage/repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../storage/repository')>()
  return { ...actual, listProgress: vi.fn(actual.listProgress) }
})
const load = vi.mocked(loadArtworks)

function setup(url = '/galeri') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <GalleryPage />
    </MemoryRouter>,
  )
}

describe('GalleryPage', () => {
  beforeEach(async () => {
    load.mockReset()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    load.mockResolvedValue(TEST_ARTWORKS)
    await clearAllForTests()
    useSession.setState({ currentUser: null, restored: false })
    await useSession.getState().login('Budi')
    await saveProgress('budi', makeProgress('animal-1', 45))
    await saveProgress('budi', makeProgress('scenery-1', 100))
  })

  it('shows loading and then the cards with progress badges', async () => {
    setup()
    expect(screen.getByText(ID.gallery.loading)).toBeInTheDocument()
    expect(await screen.findByText('Kucing Oranye')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('45%')).toBeInTheDocument())
    expect(screen.getByText(ID.gallery.done)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('links each card to the editor', async () => {
    setup()
    const link = (await screen.findByText('Kelinci')).closest('a')
    expect(link).toHaveAttribute('href', '/warnai/animal-2')
  })

  it('shows an error with a retry button that reloads', async () => {
    load.mockRejectedValueOnce(new Error('Gagal memuat data gambar.'))
    const user = userEvent.setup()
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Gagal memuat data gambar.')
    await user.click(screen.getByRole('button', { name: ID.gallery.retry }))
    expect(await screen.findByText('Kelinci')).toBeInTheDocument()
  })

  it('filters by category via toggle buttons', async () => {
    const user = userEvent.setup()
    setup()
    await screen.findByText('Kelinci')
    const hewan = screen.getByRole('button', { name: ID.gallery.categories.animal })
    await user.click(hewan)
    expect(hewan).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('Gunung Biru')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('searches by title and shows the empty state', async () => {
    const user = userEvent.setup()
    setup()
    await screen.findByText('Kelinci')
    const search = screen.getByRole('searchbox')
    await user.type(search, 'cafe')
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    await user.clear(search)
    await user.type(search, 'zzz')
    expect(screen.getByText(ID.gallery.empty)).toBeInTheDocument()
  })

  it('filters by status tab', async () => {
    const user = userEvent.setup()
    setup()
    await screen.findByText('Kelinci')
    await waitFor(() => expect(screen.getByText('45%')).toBeInTheDocument())
    const group = screen.getByRole('group', { name: ID.gallery.statusGroup })
    await user.click(within(group).getByRole('button', { name: ID.gallery.statuses.inProgress }))
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    await user.click(within(group).getByRole('button', { name: ID.gallery.statuses.done }))
    expect(screen.getByText('Gunung Biru')).toBeInTheDocument()
    await user.click(within(group).getByRole('button', { name: ID.gallery.statuses.all }))
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('restores filters from the URL query', async () => {
    setup('/galeri?kategori=hewan&status=sedang&q=kuc')
    expect(await screen.findByText('Kucing Oranye')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1))
  })

  it('ignores unknown query values', async () => {
    setup('/galeri?kategori=xx&status=yy')
    await screen.findByText('Kelinci')
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('shows a progress error and retries it', async () => {
    const user = userEvent.setup()
    vi.mocked(listProgress).mockRejectedValueOnce(new Error('Gagal membaca progres.'))
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Gagal membaca progres.')
    await user.click(screen.getByRole('button', { name: ID.gallery.retry }))
    expect(await screen.findByText('Kelinci')).toBeInTheDocument()
  })
})

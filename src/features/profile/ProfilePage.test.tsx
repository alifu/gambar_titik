import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ID } from '../../i18n/id'
import { buildExportFile } from '../../storage/exportImport'
import { clearAllForTests, listProgress, saveProgress } from '../../storage/repository'
import type { Progress } from '../../types/progress'
import { useSession } from '../../user/useSession'
import { ProfilePage } from './ProfilePage'

const prog = (artId: string, updatedAt: number, completed = false): Progress => ({
  artId,
  mode: 'free',
  colors: ['#ff0000', null],
  percent: 50,
  completed,
  recentColors: [],
  updatedAt,
})
const getPixelCount = (id: string) => (id === 'a' || id === 'b' ? 2 : undefined)

function setup() {
  return render(
    <MemoryRouter initialEntries={['/profil']}>
      <Routes>
        <Route path="/profil" element={<ProfilePage getPixelCount={getPixelCount} />} />
        <Route path="/login" element={<h1>Halaman masuk</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

const fileOf = (content: string) =>
  new File([content], 'cadangan.json', { type: 'application/json' })

describe('ProfilePage', () => {
  beforeEach(async () => {
    await clearAllForTests()
    useSession.setState({ currentUser: null, restored: false })
    await useSession.getState().login('Budi')
    await saveProgress('budi', prog('a', 5, true))
    await saveProgress('budi', prog('b', 5))
  })

  it('shows the name and artwork counts', async () => {
    setup()
    expect(screen.getByText('Budi')).toBeInTheDocument()
    expect(await screen.findByText(`${ID.profile.artworksStarted}: 2`)).toBeInTheDocument()
    expect(screen.getByText(`${ID.profile.artworksCompleted}: 1`)).toBeInTheDocument()
  })

  it('downloads a backup', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: ID.profile.backup }))
    await waitFor(() => expect(click).toHaveBeenCalled())
  })

  it('restores with merge and warns about a different name', async () => {
    const user = userEvent.setup()
    setup()
    const current = useSession.getState().currentUser
    if (!current) throw new Error('no user')
    const file = buildExportFile({ ...current, id: 'ani', displayName: 'Ani' }, [
      prog('a', 9),
      prog('zzz', 1),
    ])
    await user.upload(screen.getByLabelText(ID.profile.restore), fileOf(JSON.stringify(file)))
    await user.click(await screen.findByRole('button', { name: ID.profile.merge }))
    expect(await screen.findByText(ID.profile.importDone(1))).toBeInTheDocument()
    expect(screen.getByText(ID.profile.differentName('Ani', 'Budi'))).toBeInTheDocument()
    expect(screen.getByText(ID.profile.skipped('zzz'))).toBeInTheDocument()
    expect((await listProgress('budi')).find((p) => p.artId === 'a')?.updatedAt).toBe(9)
  })

  it('restores with replace', async () => {
    const user = userEvent.setup()
    setup()
    const current = useSession.getState().currentUser
    if (!current) throw new Error('no user')
    const file = buildExportFile(current, [prog('a', 9)])
    await user.upload(screen.getByLabelText(ID.profile.restore), fileOf(JSON.stringify(file)))
    await user.click(await screen.findByRole('button', { name: ID.profile.replace }))
    await screen.findByText(ID.profile.importDone(1))
    expect((await listProgress('budi')).map((p) => p.artId)).toEqual(['a'])
  })

  it('can cancel the restore dialog', async () => {
    const user = userEvent.setup()
    setup()
    const current = useSession.getState().currentUser
    if (!current) throw new Error('no user')
    const file = buildExportFile(current, [prog('a', 9)])
    await user.upload(screen.getByLabelText(ID.profile.restore), fileOf(JSON.stringify(file)))
    await user.click(await screen.findByRole('button', { name: ID.profile.cancel }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows errors for a broken file', async () => {
    const user = userEvent.setup()
    setup()
    await user.upload(screen.getByLabelText(ID.profile.restore), fileOf('{rusak'))
    expect(await screen.findByText(ID.importError.badJson)).toBeInTheDocument()
  })

  it('logs out and goes to the login page', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: ID.profile.switchUser }))
    expect(await screen.findByText('Halaman masuk')).toBeInTheDocument()
    expect(useSession.getState().currentUser).toBeNull()
  })
})

describe('ProfilePage without image data', () => {
  it('disables restore while the lookup is not ready', async () => {
    await useSession.getState().login('Budi')
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    )
    expect(screen.getByLabelText(ID.profile.restore)).toBeDisabled()
    expect(screen.getByText(ID.profile.importLoading)).toBeInTheDocument()
  })

  it('shows the lookup error instead of the loading hint', async () => {
    await useSession.getState().login('Budi')
    render(
      <MemoryRouter>
        <ProfilePage lookupError="Gagal memuat data gambar." />
      </MemoryRouter>,
    )
    expect(screen.getByText('Gagal memuat data gambar.')).toBeInTheDocument()
  })
})

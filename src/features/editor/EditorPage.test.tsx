import { isOutline } from '../../render/pixelColors'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getArtworkById } from '../../data/artworks'
import { ArtworkDataError } from '../../data/codec'
import { ID } from '../../i18n/id'
import { StorageError, getProgress, saveProgress } from '../../storage/repository'
import { REGION_A, TEST_ARTWORK as art } from '../../test/editorArtwork'
import type { Progress } from '../../types/progress'
import { useSession } from '../../user/useSession'
import { AUTOSAVE_DELAY_MS } from './useAutoSave'
import { EditorPage } from './EditorPage'

vi.mock('../../data/artworks', () => ({ getArtworkById: vi.fn() }))
vi.mock('../../storage/repository', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../storage/repository')>()),
  getProgress: vi.fn(),
  saveProgress: vi.fn(),
}))

const getArtworkMock = vi.mocked(getArtworkById)
const getProgressMock = vi.mocked(getProgress)
const saveProgressMock = vi.mocked(saveProgress)
const FIRST_COLOR = art.palette[1].hex
const USER = { id: 'budi', displayName: 'Budi', createdAt: 1, lastLoginAt: 1 }

function renderEditor(artId = art.id) {
  return render(
    <MemoryRouter initialEntries={[`/warnai/${artId}`]}>
      <Routes>
        <Route path="/warnai/:artId" element={<EditorPage />} />
        <Route path="/galeri" element={<h1>Halaman galeri</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function renderReady(progress?: Progress) {
  getProgressMock.mockResolvedValue(progress)
  const view = renderEditor()
  await screen.findByRole('heading', { name: art.title })
  await waitFor(() => expect(stageOf().style.width).toBe('60px'))
  return view
}

const canvasBox = () =>
  screen.getByRole('img', { name: ID.editor.canvasLabel(art.title) }).closest('.editor-canvas')!

const stageOf = () => canvasBox().querySelector('.editor-canvas-stage') as HTMLElement

/** Container 76×76 → zoom 10, gambar mulai di (8, 8). */
const at = (index: number) => ({
  clientX: 8 + (index % art.width) * 10 + 5,
  clientY: 8 + Math.floor(index / art.width) * 10 + 5,
})

function tap(index: number) {
  fireEvent.pointerDown(canvasBox(), { pointerId: 1, button: 0, ...at(index) })
  fireEvent.pointerUp(canvasBox(), { pointerId: 1, ...at(index) })
}

const percentText = (percent: number) => screen.getByText(ID.editor.progress(percent))
const toolButton = (name: string) => screen.getByRole('button', { name })

describe('EditorPage', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(76)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(76)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    getArtworkMock.mockReset().mockResolvedValue(art)
    getProgressMock.mockReset().mockResolvedValue(undefined)
    saveProgressMock.mockReset().mockResolvedValue(undefined)
    useSession.setState({ currentUser: USER, restored: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('menampilkan status memuat lalu editor', async () => {
    renderEditor()
    expect(screen.getByRole('status')).toHaveTextContent(ID.editor.loading)
    expect(await screen.findByRole('heading', { name: art.title })).toBeInTheDocument()
    expect(percentText(0)).toBeInTheDocument()
    expect(getProgressMock).toHaveBeenCalledWith('budi', art.id)
  })

  it('memulihkan progres tersimpan', async () => {
    const colors = art.pixels.map((_, i) => (!isOutline(art, i) && i < 2 ? '#123456' : null))
    await renderReady({
      artId: art.id,
      mode: 'free',
      colors,
      percent: 11,
      completed: true,
      recentColors: ['#123456'],
      updatedAt: 1,
    })
    expect(percentText(11)).toBeInTheDocument()
    expect(screen.getByText(ID.editor.completedBadge)).toBeInTheDocument()
    expect(screen.getByText(ID.editor.currentColor('#123456'))).toBeInTheDocument()
  })

  it('error memuat → pesan + Coba lagi', async () => {
    getArtworkMock.mockRejectedValueOnce(new ArtworkDataError('Gagal memuat data gambar.'))
    const user = userEvent.setup()
    renderEditor()
    expect(await screen.findByRole('alert')).toHaveTextContent('Gagal memuat data gambar.')
    await user.click(screen.getByRole('button', { name: ID.editor.retry }))
    expect(await screen.findByRole('heading', { name: art.title })).toBeInTheDocument()
    expect(getArtworkMock).toHaveBeenCalledTimes(2)
  })

  it('error storage saat memuat progres juga ditampilkan', async () => {
    getProgressMock.mockRejectedValueOnce(new StorageError('membaca progres'))
    renderEditor()
    expect(await screen.findByRole('alert')).toHaveTextContent(ID.storage.failed('membaca progres'))
  })

  it('artId tidak ditemukan → link kembali ke galeri', async () => {
    getArtworkMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderEditor('tidak-ada')
    expect(await screen.findByRole('heading', { name: ID.editor.notFound })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: ID.editor.backToGallery }))
    expect(screen.getByRole('heading', { name: 'Halaman galeri' })).toBeInTheDocument()
  })

  it('memilih alat via tombol dan keyboard', async () => {
    const user = userEvent.setup()
    await renderReady()
    expect(toolButton(ID.editor.tool.brush)).toHaveAttribute('aria-pressed', 'true')
    await user.click(toolButton(ID.editor.tool.bucket))
    expect(toolButton(ID.editor.tool.bucket)).toHaveAttribute('aria-pressed', 'true')
    expect(toolButton(ID.editor.brushSizeOption(2))).toBeDisabled()
    await user.keyboard('e')
    expect(toolButton(ID.editor.tool.eraser)).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('i')
    expect(toolButton(ID.editor.tool.picker)).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('b')
    expect(toolButton(ID.editor.tool.brush)).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('g')
    expect(toolButton(ID.editor.tool.bucket)).toHaveAttribute('aria-pressed', 'true')
  })

  it('input HEX invalid menampilkan error, valid dinormalisasi', async () => {
    const user = userEvent.setup()
    await renderReady()
    const field = screen.getByLabelText(ID.editor.hexLabel)
    await user.clear(field)
    await user.type(field, 'zz9{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent(ID.editor.hexInvalid)
    expect(field).toHaveAttribute('aria-invalid', 'true')
    await user.keyboard('b')
    expect(toolButton(ID.editor.tool.brush)).toHaveAttribute('aria-pressed', 'true')
    await user.clear(field)
    await user.type(field, 'F80')
    await user.click(screen.getByRole('button', { name: ID.editor.hexApply }))
    expect(screen.getByText(ID.editor.currentColor('#ff8800'))).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('memilih warna dari palet saran dan color picker', async () => {
    const user = userEvent.setup()
    await renderReady()
    await user.click(screen.getByRole('button', { name: ID.editor.pickSwatch('#3366ff') }))
    expect(screen.getByText(ID.editor.currentColor('#3366ff'))).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(ID.editor.colorPicker), { target: { value: '#00aa11' } })
    expect(screen.getByText(ID.editor.currentColor('#00aa11'))).toBeInTheDocument()
    expect(screen.getByLabelText(ID.editor.hexLabel)).toHaveValue('#00aa11')
  })

  it('auto-save debounce 500 ms memanggil saveProgress dengan data benar', async () => {
    await renderReady()
    vi.useFakeTimers()
    tap(0)
    expect(percentText(6)).toBeInTheDocument()
    expect(screen.getByText(ID.editor.saving)).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS - 1))
    expect(saveProgressMock).not.toHaveBeenCalled()
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(saveProgressMock).toHaveBeenCalledTimes(1)
    const [userId, progress] = saveProgressMock.mock.calls[0]
    expect(userId).toBe('budi')
    expect(progress).toMatchObject({
      artId: art.id,
      percent: 6,
      completed: false,
      recentColors: [FIRST_COLOR],
    })
    expect(progress.colors[0]).toBe(FIRST_COLOR)
    expect(progress.colors.filter(Boolean)).toHaveLength(1)
    expect(typeof progress.updatedAt).toBe('number')
    expect(screen.getByText(ID.editor.saved)).toBeInTheDocument()
  })

  it('tidak menyimpan ulang saat baru dibuka', async () => {
    await renderReady()
    await new Promise((resolve) => setTimeout(resolve, AUTOSAVE_DELAY_MS + 50))
    expect(saveProgressMock).not.toHaveBeenCalled()
  })

  it('menyimpan perubahan tertunda saat unmount', async () => {
    const view = await renderReady()
    tap(1)
    view.unmount()
    expect(saveProgressMock).toHaveBeenCalledTimes(1)
    expect(saveProgressMock.mock.calls[0][1].colors[1]).toBe(FIRST_COLOR)
  })

  it('error simpan ditampilkan dan bisa disimpan lagi', async () => {
    saveProgressMock.mockRejectedValueOnce(new StorageError('menyimpan progres'))
    const user = userEvent.setup()
    await renderReady()
    tap(0)
    const alert = await screen.findByRole('alert', {}, { timeout: 2000 })
    expect(alert).toHaveTextContent(ID.editor.saveFailed(ID.storage.failed('menyimpan progres')))
    await user.click(screen.getByRole('button', { name: ID.editor.saveRetry }))
    expect(await screen.findByText(ID.editor.saved)).toBeInTheDocument()
    expect(saveProgressMock).toHaveBeenCalledTimes(2)
  })

  it('ember mengisi region; undo/redo via keyboard', async () => {
    const user = userEvent.setup()
    await renderReady()
    await user.keyboard('g')
    tap(7)
    expect(percentText(22)).toBeInTheDocument()
    await user.keyboard('{Control>}z{/Control}')
    expect(percentText(0)).toBeInTheDocument()
    await user.keyboard('{Control>}y{/Control}')
    expect(percentText(22)).toBeInTheDocument()
    await user.keyboard('{Control>}z{/Control}')
    await user.keyboard('{Meta>}{Shift>}z{/Shift}{/Meta}')
    expect(percentText(22)).toBeInTheDocument()
    expect(REGION_A).toHaveLength(4)
  })

  it('drag kuas = satu langkah undo; penghapus dan pipet', async () => {
    const user = userEvent.setup()
    await renderReady()
    fireEvent.pointerDown(canvasBox(), { pointerId: 1, button: 0, ...at(30) })
    fireEvent.pointerMove(canvasBox(), { pointerId: 1, ...at(35) })
    fireEvent.pointerUp(canvasBox(), { pointerId: 1, ...at(35) })
    expect(percentText(33)).toBeInTheDocument()
    await user.click(toolButton(ID.editor.undo))
    expect(percentText(0)).toBeInTheDocument()
    await user.click(toolButton(ID.editor.redo))
    await user.click(screen.getByRole('button', { name: ID.editor.pickSwatch('#3366ff') }))
    await user.click(toolButton(ID.editor.tool.eraser))
    tap(30)
    expect(percentText(28)).toBeInTheDocument()
    await user.click(toolButton(ID.editor.tool.picker))
    tap(31)
    expect(screen.getByText(ID.editor.currentColor(FIRST_COLOR))).toBeInTheDocument()
    expect(toolButton(ID.editor.tool.brush)).toHaveAttribute('aria-pressed', 'true')
  })

  it('kuas ukuran 2 mewarnai 2×2', async () => {
    const user = userEvent.setup()
    await renderReady()
    await user.click(toolButton(ID.editor.brushSizeOption(2)))
    tap(14)
    expect(percentText(22)).toBeInTheDocument()
  })

  it('tandai selesai lalu disimpan', async () => {
    const user = userEvent.setup()
    await renderReady()
    await user.click(screen.getByRole('button', { name: ID.editor.markDone }))
    expect(screen.getByText(ID.editor.completedBadge)).toBeInTheDocument()
    await waitFor(() => expect(saveProgressMock).toHaveBeenCalled())
    expect(saveProgressMock.mock.calls[0][1].completed).toBe(true)
    await user.click(screen.getByRole('button', { name: ID.editor.markUndone }))
    expect(screen.queryByText(ID.editor.completedBadge)).toBeNull()
  })

  it('reset dengan konfirmasi dan bisa di-undo', async () => {
    const user = userEvent.setup()
    await renderReady()
    tap(0)
    await user.click(screen.getByRole('button', { name: ID.editor.reset }))
    expect(screen.getByRole('alertdialog', { name: ID.editor.resetTitle })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: ID.editor.cancel }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(percentText(6)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: ID.editor.reset }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).toBeNull()

    await user.click(screen.getByRole('button', { name: ID.editor.reset }))
    await user.click(screen.getByRole('button', { name: ID.editor.resetConfirm }))
    expect(percentText(0)).toBeInTheDocument()
    await user.keyboard('{Control>}z{/Control}')
    expect(percentText(6)).toBeInTheDocument()
  })

  it('Lihat contoh: tahan pointer atau toggle dengan keyboard', async () => {
    const user = userEvent.setup()
    await renderReady()
    const button = screen.getByRole('button', { name: ID.editor.showReference })
    fireEvent.pointerDown(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    fireEvent.pointerUp(button)
    expect(button).toHaveAttribute('aria-pressed', 'false')
    button.focus()
    await user.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('zoom via tombol dan keyboard, spasi = mode geser', async () => {
    const user = userEvent.setup()
    await renderReady()
    expect(stageOf().style.width).toBe('60px')
    await user.click(toolButton(ID.editor.zoomIn))
    expect(stageOf().style.width).toBe('75px')
    await user.keyboard('-')
    expect(stageOf().style.width).toBe('60px')
    await user.keyboard('+')
    await user.keyboard('0')
    expect(stageOf().style.width).toBe('60px')
    await user.click(toolButton(ID.editor.zoomOut))
    expect(stageOf().style.width).toBe('48px')
    toolButton(ID.editor.zoomOut).blur()
    fireEvent.keyDown(document.body, { key: ' ' })
    expect(canvasBox()).toHaveClass('editor-canvas--pan')
    fireEvent.keyUp(document.body, { key: ' ' })
    expect(canvasBox()).not.toHaveClass('editor-canvas--pan')
  })

  it('Unduh PNG membuat file dari judul', async () => {
    const ctx = { fillStyle: '', fillRect: vi.fn() }
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    )
    HTMLCanvasElement.prototype.toBlob = vi.fn((cb: BlobCallback) => cb(new Blob(['x'])))
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const user = userEvent.setup()
    await renderReady()
    await user.click(screen.getByRole('button', { name: ID.editor.download }))
    await waitFor(() => expect(click).toHaveBeenCalled())
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('kucing-uji.png')
  })

  it('Unduh PNG gagal → pesan error', async () => {
    const user = userEvent.setup()
    await renderReady()
    await user.click(screen.getByRole('button', { name: ID.editor.download }))
    expect(await screen.findByRole('alert')).toHaveTextContent(ID.editor.downloadFailed)
  })
})

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getArtworkById } from '../../data/artworks'
import { ID } from '../../i18n/id'
import { StorageError, getProgress, saveProgress } from '../../storage/repository'
import type { Artwork } from '../../types/artwork'
import type { ColoringMode, Progress } from '../../types/progress'
import { useSession } from '../../user/useSession'
import { EditorPage } from './EditorPage'
import { REJECT_FLASH_MS } from './useNumberColoring'

vi.mock('../../data/artworks', () => ({ getArtworkById: vi.fn() }))
vi.mock('../../storage/repository', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../storage/repository')>()),
  getProgress: vi.fn(),
  saveProgress: vi.fn(),
}))

/**
 * 4×3, '-' = latar:
 * r0: - 1 1 -
 * r1: 0 1 2 2
 * r2: 0 0 2 1
 */
const art: Artwork = {
  id: 'nomor-uji',
  title: 'Nomor Uji',
  category: 'animal',
  width: 4,
  height: 3,
  palette: [
    { code: '0', name: 'Hitam', hex: '#000000' },
    { code: '1', name: 'Merah', hex: '#ff0000' },
    { code: '2', name: 'Hijau', hex: '#00ff00' },
  ],
  pixels: [-1, 1, 1, -1, 0, 1, 2, 2, 0, 0, 2, 1],
}
const USER = { id: 'budi', displayName: 'Budi', createdAt: 1, lastLoginAt: 1 }
const getProgressMock = vi.mocked(getProgress)
const saveProgressMock = vi.mocked(saveProgress)

function LocationProbe() {
  const location = useLocation()
  return <p data-testid="location">{location.pathname + location.search}</p>
}

function renderEditor(query = '?mode=nomor') {
  return render(
    <MemoryRouter initialEntries={[`/warnai/${art.id}${query}`]}>
      <Routes>
        <Route
          path="/warnai/:artId"
          element={
            <>
              <EditorPage />
              <LocationProbe />
            </>
          }
        />
        <Route path="/galeri" element={<h1>Halaman galeri</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function renderReady(query?: string) {
  const view = renderEditor(query)
  await screen.findByRole('heading', { name: art.title })
  await waitFor(() => expect(stage().style.width).toBe('60px'))
  return view
}

const canvasBox = () =>
  screen.getByRole('img', { name: ID.editor.canvasLabel(art.title) }).closest('.editor-canvas')!
const stage = () => canvasBox().querySelector('.editor-canvas-stage') as HTMLElement

/** Container 76×76 → zoom 15, gambar 60×45 mulai di (8, 15.5). */
const at = (index: number) => ({
  clientX: 8 + (index % art.width) * 15 + 7,
  clientY: 15.5 + Math.floor(index / art.width) * 15 + 7,
})

function tap(index: number) {
  fireEvent.pointerDown(canvasBox(), { pointerId: 1, button: 0, ...at(index) })
  fireEvent.pointerUp(canvasBox(), { pointerId: 1, ...at(index) })
}

const entry = (code: string) => screen.getByRole('button', { name: new RegExp(`^Kode ${code},`) })
const percent = (value: number) => screen.getByText(ID.editor.progress(value))

const stored = (
  mode: ColoringMode,
  updatedAt: number,
  colors: Progress['colors'] = art.pixels.map(() => null),
) =>
  ({
    artId: art.id,
    mode,
    colors,
    percent: 0,
    completed: false,
    recentColors: [],
    updatedAt,
  }) satisfies Progress

function solveAllBut(index: number) {
  return art.pixels.map((v, i) => (v < 0 || i === index ? null : art.palette[v].hex))
}

describe('Editor mode sesuai nomor', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(76)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(76)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    vi.mocked(getArtworkById).mockReset().mockResolvedValue(art)
    getProgressMock.mockReset().mockResolvedValue(undefined)
    saveProgressMock.mockReset().mockResolvedValue(undefined)
    useSession.setState({ currentUser: USER, restored: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('menampilkan legenda dengan sisa kotak dan kode di kanvas', async () => {
    await renderReady()
    expect(getProgressMock).toHaveBeenCalledWith('budi', art.id, 'number')
    expect(entry('0')).toHaveAccessibleName(ID.numberMode.entryLabel('0', 'Hitam', 3))
    expect(entry('1')).toHaveAccessibleName(ID.numberMode.entryLabel('1', 'Merah', 4))
    expect(entry('0')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('cell-labels')).toBeInTheDocument()
    expect(screen.queryByText(ID.numberMode.zoomHint)).toBeNull()
    expect(screen.queryByRole('button', { name: ID.editor.tool.eraser })).toBeNull()
  })

  it('memilih warna lewat klik dan tombol kode; tombol lain tetap pintasan', async () => {
    const user = userEvent.setup()
    await renderReady()
    await user.click(entry('2'))
    expect(entry('2')).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('1')
    expect(entry('1')).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('g')
    expect(screen.getByRole('button', { name: ID.numberMode.fillArea })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.keyboard('e')
    expect(screen.getByRole('button', { name: ID.numberMode.fillArea })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('kotak benar terisi, kotak kode lain & latar ditolak tanpa berubah', async () => {
    const user = userEvent.setup()
    await renderReady()
    await user.click(entry('1'))
    tap(1)
    expect(percent(10)).toBeInTheDocument()
    expect(entry('1')).toHaveAccessibleName(ID.numberMode.entryLabel('1', 'Merah', 3))
    vi.useFakeTimers()
    tap(6)
    expect(percent(10)).toBeInTheDocument()
    expect(screen.getAllByTestId('reject-mark')).toHaveLength(1)
    expect(screen.getByText(ID.numberMode.wrongCell('1'))).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(REJECT_FLASH_MS))
    expect(screen.queryByTestId('reject-mark')).toBeNull()
    tap(0)
    expect(screen.queryByTestId('reject-mark')).toBeNull()
    expect(percent(10)).toBeInTheDocument()
  })

  it('drag hanya mengisi kode yang sama; undo/redo', async () => {
    const user = userEvent.setup()
    await renderReady()
    await user.keyboard('1')
    fireEvent.pointerDown(canvasBox(), { pointerId: 1, button: 0, ...at(4) })
    fireEvent.pointerMove(canvasBox(), { pointerId: 1, ...at(7) })
    fireEvent.pointerUp(canvasBox(), { pointerId: 1, ...at(7) })
    expect(percent(10)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: ID.editor.undo }))
    expect(percent(0)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: ID.editor.redo }))
    expect(percent(10)).toBeInTheDocument()
  })

  it('isi area mengisi kotak berkode sama yang terhubung 4-arah', async () => {
    const user = userEvent.setup()
    await renderReady()
    await user.click(screen.getByRole('button', { name: ID.numberMode.fillArea }))
    await user.keyboard('1')
    tap(5)
    expect(percent(30)).toBeInTheDocument()
    tap(6)
    expect(percent(30)).toBeInTheDocument()
    expect(screen.getAllByTestId('reject-mark')).toHaveLength(1)
  })

  it('selesai otomatis: ✓ di legenda, pesan selesai, disimpan completed', async () => {
    getProgressMock.mockResolvedValue(stored('number', 1, solveAllBut(11)))
    const user = userEvent.setup()
    await renderReady()
    expect(entry('0')).toHaveAccessibleName(ID.numberMode.entryLabel('0', 'Hitam', 0))
    expect(screen.getAllByText(ID.numberMode.doneMark)).toHaveLength(2)
    expect(entry('1')).toHaveAttribute('aria-pressed', 'true')
    tap(11)
    const dialog = screen.getByRole('dialog', { name: ID.numberMode.doneTitle })
    expect(dialog).toBeInTheDocument()
    expect(percent(100)).toBeInTheDocument()
    expect(screen.getByText(ID.editor.completedBadge)).toBeInTheDocument()
    await waitFor(() => expect(saveProgressMock).toHaveBeenCalled())
    expect(saveProgressMock.mock.calls[0][1]).toMatchObject({
      mode: 'number',
      percent: 100,
      completed: true,
    })
    await user.click(screen.getByRole('button', { name: ID.numberMode.viewResult }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('pesan selesai: Esc menutup, Unduh PNG gagal menampilkan error, kembali ke galeri', async () => {
    getProgressMock.mockResolvedValue(stored('number', 1, solveAllBut(11)))
    const user = userEvent.setup()
    await renderReady()
    tap(11)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    await user.click(screen.getByRole('button', { name: ID.editor.undo }))
    tap(11)
    const dialog = screen.getByRole('dialog')
    await user.click(dialog.querySelector('button:not(.editor-button-secondary)')!)
    expect(await screen.findAllByText(ID.editor.downloadFailed)).not.toHaveLength(0)
    await user.click(dialog.querySelector('a')!)
    expect(screen.getByRole('heading', { name: 'Halaman galeri' })).toBeInTheDocument()
  })

  it('dibuka sudah selesai: tidak ada pesan selesai', async () => {
    getProgressMock.mockResolvedValue(stored('number', 1, solveAllBut(-1)))
    await renderReady()
    expect(percent(100)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('Lihat contoh menyembunyikan kode', async () => {
    await renderReady()
    const button = screen.getByRole('button', { name: ID.editor.showReference })
    fireEvent.pointerDown(button)
    expect(screen.queryByTestId('cell-labels')).toBeNull()
    fireEvent.pointerUp(button)
    expect(screen.getByTestId('cell-labels')).toBeInTheDocument()
  })

  it('reset dengan konfirmasi menghapus warna', async () => {
    const user = userEvent.setup()
    await renderReady()
    await user.keyboard('1')
    tap(1)
    await user.click(screen.getByRole('button', { name: ID.editor.reset }))
    await user.click(screen.getByRole('button', { name: ID.editor.cancel }))
    expect(percent(10)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: ID.editor.reset }))
    await user.click(screen.getByRole('button', { name: ID.editor.resetConfirm }))
    expect(percent(0)).toBeInTheDocument()
  })

  it('petunjuk zoom muncul jika kotak masih kecil', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(40)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40)
    renderEditor()
    expect(await screen.findByText(ID.numberMode.zoomHint)).toBeInTheDocument()
  })
})

describe('pilih & ganti mode', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(76)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(76)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    vi.mocked(getArtworkById).mockReset().mockResolvedValue(art)
    getProgressMock.mockReset().mockResolvedValue(undefined)
    saveProgressMock.mockReset().mockResolvedValue(undefined)
    useSession.setState({ currentUser: USER, restored: true })
  })

  afterEach(() => vi.restoreAllMocks())

  const modeButton = (mode: ColoringMode) => screen.getByRole('button', { name: ID.mode[mode] })

  it('tanpa mode di URL dan belum ada progres → mode nomor', async () => {
    await renderReady('')
    expect(modeButton('number')).toHaveAttribute('aria-pressed', 'true')
    expect(getProgressMock).toHaveBeenCalledWith('budi', art.id, 'free')
    expect(getProgressMock).toHaveBeenCalledWith('budi', art.id, 'number')
  })

  it('mode tidak valid → mode progres terbaru', async () => {
    getProgressMock.mockImplementation(async (_u, _a, mode) =>
      mode === 'free' ? stored('free', 9) : stored('number', 2),
    )
    await renderReady('?mode=abc')
    expect(modeButton('free')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: ID.editor.tool.eraser })).toBeInTheDocument()
  })

  it('ganti mode menyimpan progres dulu lalu memuat progres mode lain', async () => {
    const user = userEvent.setup()
    await renderReady()
    await user.keyboard('1')
    tap(1)
    await user.click(modeButton('free'))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('?mode=bebas'))
    expect(saveProgressMock).toHaveBeenCalledTimes(1)
    expect(saveProgressMock.mock.calls[0][1]).toMatchObject({ mode: 'number', percent: 10 })
    await screen.findByRole('button', { name: ID.editor.tool.eraser })
    expect(getProgressMock).toHaveBeenLastCalledWith('budi', art.id, 'free')
    await user.click(modeButton('free'))
    expect(screen.getByTestId('location')).toHaveTextContent('?mode=bebas')
    await user.click(modeButton('number'))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('?mode=nomor'))
    expect(await screen.findByRole('button', { name: /^Kode 1,/ })).toBeInTheDocument()
  })

  it('simpan gagal → mode tidak diganti dan error tampil', async () => {
    saveProgressMock.mockRejectedValue(new StorageError('menyimpan progres'))
    const user = userEvent.setup()
    await renderReady()
    await user.keyboard('1')
    tap(1)
    await user.click(modeButton('free'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      ID.editor.saveFailed(ID.storage.failed('menyimpan progres')),
    )
    expect(screen.getByTestId('location')).toHaveTextContent('?mode=nomor')
    expect(modeButton('number')).toHaveAttribute('aria-pressed', 'true')
  })
})

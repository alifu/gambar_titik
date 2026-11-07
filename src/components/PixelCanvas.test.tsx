import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Viewport } from '../editor/viewport'
import { PixelCanvas, TOUCH_MOVE_THRESHOLD_PX, TOUCH_STROKE_DELAY_MS } from './PixelCanvas'

const VP: Viewport = { zoom: 10, panX: 0, panY: 0 }
const PIXELS = ['#000000', '#111111', '#222222', '#333333']

function setup(overrides: { isPanMode?: boolean } = {}) {
  const props = {
    width: 2,
    height: 2,
    pixels: PIXELS,
    viewport: VP,
    isPanMode: false,
    label: 'Kanvas uji',
    onViewportChange: vi.fn(),
    onResize: vi.fn(),
    onStrokeStart: vi.fn(),
    onStrokeMove: vi.fn(),
    onStrokeEnd: vi.fn(),
    ...overrides,
  }
  const view = render(<PixelCanvas {...props} />)
  const canvas = screen.getByRole('img', { name: 'Kanvas uji' })
  const container = canvas.closest('.editor-canvas') as HTMLElement
  return { props, view, canvas, container }
}

/** Pusat pixel (x, y) pada zoom 10 tanpa geser. */
const at = (x: number, y: number) => ({ clientX: x * 10 + 5, clientY: y * 10 + 5 })

describe('PixelCanvas', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(120)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(80)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('merender canvas ukuran asli dengan pixelated dan aman jika getContext null', async () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { canvas, props } = setup()
    expect(canvas).toHaveAttribute('width', '2')
    expect(canvas).toHaveAttribute('height', '2')
    expect(canvas.style.imageRendering).toBe('pixelated')
    await waitFor(() => expect(getContext).toHaveBeenCalled())
    expect(props.onResize).toHaveBeenCalledWith({ width: 120, height: 80 })
  })

  it('menggambar ulang hanya pixel yang berubah', async () => {
    const ctx = { fillStyle: '', fillRect: vi.fn() }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    )
    const { view, props } = setup()
    await waitFor(() => expect(ctx.fillRect).toHaveBeenCalledTimes(4))
    ctx.fillRect.mockClear()
    view.rerender(<PixelCanvas {...props} pixels={['#000000', '#ff0000', '#222222', '#333333']} />)
    await waitFor(() => expect(ctx.fillRect).toHaveBeenCalledTimes(1))
    expect(ctx.fillRect).toHaveBeenCalledWith(1, 0, 1, 1)
  })

  it('tap + drag = goresan start/move/end', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { container, props } = setup()
    fireEvent.pointerDown(container, { pointerId: 1, button: 0, ...at(0, 0) })
    fireEvent.pointerMove(container, { pointerId: 1, ...at(0, 0) })
    fireEvent.pointerMove(container, { pointerId: 1, ...at(1, 1) })
    fireEvent.pointerUp(container, { pointerId: 1, ...at(1, 1) })
    expect(props.onStrokeStart).toHaveBeenCalledWith(0)
    expect(props.onStrokeMove).toHaveBeenCalledTimes(1)
    expect(props.onStrokeMove).toHaveBeenCalledWith(3)
    expect(props.onStrokeEnd).toHaveBeenCalledTimes(1)
  })

  it('goresan dimulai saat pointer masuk ke gambar; klik kanan diabaikan', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { container, props } = setup()
    fireEvent.pointerDown(container, { pointerId: 1, button: 2, ...at(0, 0) })
    expect(props.onStrokeStart).not.toHaveBeenCalled()
    fireEvent.pointerDown(container, { pointerId: 2, button: 0, clientX: 100, clientY: 70 })
    fireEvent.pointerMove(container, { pointerId: 2, ...at(1, 0) })
    expect(props.onStrokeStart).toHaveBeenCalledWith(1)
    fireEvent.pointerUp(container, { pointerId: 99 })
    expect(props.onStrokeEnd).not.toHaveBeenCalled()
  })

  it('mode geser: drag memanggil onViewportChange dengan pan', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { container, props } = setup({ isPanMode: true })
    expect(container).toHaveClass('editor-canvas--pan')
    fireEvent.pointerDown(container, { pointerId: 1, button: 0, clientX: 10, clientY: 10 })
    fireEvent.pointerMove(container, { pointerId: 1, clientX: 25, clientY: 5 })
    fireEvent.pointerUp(container, { pointerId: 1 })
    expect(props.onStrokeStart).not.toHaveBeenCalled()
    const update = props.onViewportChange.mock.calls[0][0] as (vp: Viewport) => Viewport
    expect(update(VP)).toEqual({ zoom: 10, panX: 15, panY: -5 })
  })

  it('wheel = zoom di posisi kursor', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { container, props } = setup()
    fireEvent.wheel(container, { deltaY: -100, clientX: 0, clientY: 0 })
    const update = props.onViewportChange.mock.calls[0][0] as (vp: Viewport) => Viewport
    expect(update(VP).zoom).toBeGreaterThan(10)
  })

  it('dua jari = pinch zoom, goresan jari pertama diakhiri', () => {
    vi.useFakeTimers()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { container, props } = setup()
    fireEvent.pointerDown(container, { pointerId: 1, button: 0, pointerType: 'touch', ...at(0, 0) })
    act(() => vi.advanceTimersByTime(TOUCH_STROKE_DELAY_MS))
    fireEvent.pointerDown(container, {
      pointerId: 2,
      button: 0,
      pointerType: 'touch',
      clientX: 15,
      clientY: 5,
    })
    expect(props.onStrokeEnd).toHaveBeenCalledTimes(1)
    fireEvent.pointerMove(container, {
      pointerId: 2,
      pointerType: 'touch',
      clientX: 25,
      clientY: 5,
    })
    const update = props.onViewportChange.mock.calls[0][0] as (vp: Viewport) => Viewport
    expect(update(VP).zoom).toBe(20)
    fireEvent.pointerUp(container, { pointerId: 2, pointerType: 'touch' })
    fireEvent.pointerMove(container, { pointerId: 1, pointerType: 'touch', ...at(1, 1) })
    expect(props.onStrokeMove).not.toHaveBeenCalled()
  })

  it('grid tampil hanya saat zoom besar; highlight pixel di bawah kursor', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { container, view, props } = setup()
    expect(screen.getByTestId('pixel-grid')).toBeInTheDocument()
    fireEvent.pointerMove(container, { pointerId: 1, pointerType: 'mouse', ...at(1, 0) })
    const hover = container.querySelector('.editor-canvas-hover') as HTMLElement
    expect(hover.style.left).toBe('10px')
    fireEvent.pointerLeave(container, { pointerType: 'mouse' })
    expect(container.querySelector('.editor-canvas-hover')).toBeNull()
    view.rerender(<PixelCanvas {...props} viewport={{ zoom: 4, panX: 0, panY: 0 }} />)
    expect(screen.queryByTestId('pixel-grid')).toBeNull()
  })

  describe('sentuhan', () => {
    const touch = { pointerType: 'touch', button: 0 }
    beforeEach(() => {
      vi.useFakeTimers()
    })

    it('jari kedua sebelum jeda membatalkan goresan: tidak ada pixel terwarnai', () => {
      const { container, props } = setup()
      fireEvent.pointerDown(container, { pointerId: 1, ...touch, ...at(0, 0) })
      act(() => vi.advanceTimersByTime(TOUCH_STROKE_DELAY_MS - 1))
      fireEvent.pointerDown(container, { pointerId: 2, ...touch, ...at(1, 1) })
      act(() => vi.advanceTimersByTime(TOUCH_STROKE_DELAY_MS * 2))

      expect(props.onStrokeStart).not.toHaveBeenCalled()
      expect(props.onStrokeEnd).not.toHaveBeenCalled()
    })

    it('menahan jari melewati jeda memulai goresan', () => {
      const { container, props } = setup()
      fireEvent.pointerDown(container, { pointerId: 1, ...touch, ...at(0, 0) })
      expect(props.onStrokeStart).not.toHaveBeenCalled()
      act(() => vi.advanceTimersByTime(TOUCH_STROKE_DELAY_MS))

      expect(props.onStrokeStart).toHaveBeenCalledWith(0)
    })

    it('tap cepat tetap mewarnai satu pixel saat jari diangkat', () => {
      const { container, props } = setup()
      fireEvent.pointerDown(container, { pointerId: 1, ...touch, ...at(1, 0) })
      fireEvent.pointerUp(container, { pointerId: 1, ...touch, ...at(1, 0) })

      expect(props.onStrokeStart).toHaveBeenCalledWith(1)
      expect(props.onStrokeEnd).toHaveBeenCalledTimes(1)
    })

    it('geser lebih dari ambang langsung memulai goresan tanpa menunggu', () => {
      const { container, props } = setup()
      fireEvent.pointerDown(container, { pointerId: 1, ...touch, ...at(0, 0) })
      fireEvent.pointerMove(container, {
        pointerId: 1,
        ...touch,
        clientX: 5 + TOUCH_MOVE_THRESHOLD_PX + 6,
        clientY: 5,
      })

      expect(props.onStrokeStart).toHaveBeenCalledWith(0)
      expect(props.onStrokeMove).toHaveBeenCalledWith(1)
    })
  })
})

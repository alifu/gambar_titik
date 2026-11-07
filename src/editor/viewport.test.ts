import { describe, expect, it } from 'vitest'
import {
  MAX_ZOOM,
  MIN_ZOOM,
  clampZoom,
  fitViewport,
  panBy,
  screenToIndex,
  zoomAt,
} from './viewport'

const art = { width: 6, height: 4 }

describe('viewport', () => {
  it('screenToIndex mengonversi koordinat layar ke indeks pixel', () => {
    const vp = { zoom: 10, panX: 5, panY: 20 }
    expect(screenToIndex(vp, art, 5, 20)).toBe(0)
    expect(screenToIndex(vp, art, 14.9, 29.9)).toBe(0)
    expect(screenToIndex(vp, art, 25, 35)).toBe(8)
    expect(screenToIndex(vp, art, 64, 59)).toBe(23)
  })

  it('screenToIndex mengembalikan null di luar gambar', () => {
    const vp = { zoom: 10, panX: 0, panY: 0 }
    expect(screenToIndex(vp, art, -1, 5)).toBeNull()
    expect(screenToIndex(vp, art, 5, -1)).toBeNull()
    expect(screenToIndex(vp, art, 60, 5)).toBeNull()
    expect(screenToIndex(vp, art, 5, 40)).toBeNull()
  })

  it('zoom dibatasi min/max', () => {
    expect(clampZoom(0.1)).toBe(MIN_ZOOM)
    expect(clampZoom(1000)).toBe(MAX_ZOOM)
    expect(zoomAt({ zoom: MAX_ZOOM, panX: 0, panY: 0 }, 2, 0, 0).zoom).toBe(MAX_ZOOM)
  })

  it('zoomAt menjaga titik anchor tetap di bawah kursor', () => {
    const vp = { zoom: 10, panX: 0, panY: 0 }
    const before = screenToIndex(vp, art, 33, 17)
    const zoomed = zoomAt(vp, 2, 33, 17)
    expect(zoomed.zoom).toBe(20)
    expect(zoomed.panX).toBe(-33)
    expect(zoomed.panY).toBe(-17)
    expect(screenToIndex(zoomed, art, 33, 17)).toBe(before)
  })

  it('panBy menggeser tanpa mengubah zoom', () => {
    expect(panBy({ zoom: 3, panX: 1, panY: 2 }, 10, -5)).toEqual({ zoom: 3, panX: 11, panY: -3 })
  })

  it('fitViewport memusatkan gambar sebesar mungkin', () => {
    const vp = fitViewport(art, { width: 316, height: 116 })
    expect(vp.zoom).toBe(25)
    expect(vp.panX).toBe(83)
    expect(vp.panY).toBe(8)
  })

  it('fitViewport aman untuk kontainer berukuran 0', () => {
    expect(fitViewport(art, { width: 0, height: 0 }).zoom).toBe(MIN_ZOOM)
  })
})

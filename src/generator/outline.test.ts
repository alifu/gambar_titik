import { describe, expect, it } from 'vitest'
import {
  absorbTinyRegions,
  buildOutline,
  mergeSmallRegions,
  MIN_REGION_SIZE,
  traceOutline,
} from './outline'
import { quantizeColors, rankColors } from './quantize'
import { fill, inkLayer, paint, rect, render } from './raster'
import { labelRegions, neighbors } from './regions'

describe('regions', () => {
  it('menghitung tetangga 4-arah di tepi dan tengah', () => {
    expect(neighbors(0, 3, 3).sort()).toEqual([1, 3])
    expect(neighbors(4, 3, 3).sort()).toEqual([1, 3, 5, 7])
  })

  it('memberi label komponen terhubung', () => {
    const colors = ['a', 'a', 'b', 'b']
    const { labels, sizes } = labelRegions(
      2,
      2,
      () => true,
      (x, y) => colors[x] === colors[y],
    )
    expect(sizes).toEqual([2, 2])
    expect(labels).toEqual([0, 0, 1, 1])
  })
})

describe('outline', () => {
  it('garis tepi berada di lapisan depan, 1 pixel', () => {
    const raster = render(8, 8, [fill('#ffffff'), paint(rect(2, 2, 6, 6), '#ff0000')])
    const outline = traceOutline(raster)
    expect(outline[2 * 8 + 2]).toBe(true)
    expect(outline[1 * 8 + 2]).toBe(false)
    expect(outline[3 * 8 + 3]).toBe(false)
    expect(outline.filter(Boolean)).toHaveLength(12)
  })

  it('pixel tinta selalu menjadi garis tepi', () => {
    const raster = render(4, 4, [fill('#ffffff'), inkLayer(rect(1, 1, 2, 2), '#000000')])
    expect(traceOutline(raster)[5]).toBe(true)
  })

  it('region warna kecil digabung ke tetangga', () => {
    const raster = render(6, 6, [fill('#ffffff'), paint(rect(2, 2, 3, 3), '#ff0000')])
    const merged = mergeSmallRegions(raster)
    expect(merged.colors.every((color) => color === '#ffffff')).toBe(true)
    expect(raster.colors[14]).toBe('#ff0000')
  })

  it('region yang dikelilingi tinta tidak punya donor dan tetap', () => {
    const raster = render(3, 3, [
      inkLayer(rect(0, 0, 3, 3), '#000000'),
      paint(rect(1, 1, 2, 2), '#ff0000'),
    ])
    expect(mergeSmallRegions(raster).colors[4]).toBe('#ff0000')
  })

  it('region kosong yang terlalu kecil diserap jadi garis', () => {
    const outline = [true, true, true, true, false, true, true, true, true]
    expect(absorbTinyRegions(outline, 3, 3)[4]).toBe(true)
  })

  it('hasil akhir tanpa region < MIN_REGION_SIZE', () => {
    const raster = render(10, 10, [fill('#ffffff'), paint(rect(3, 3, 6, 6), '#00ff00')])
    const { outline } = buildOutline(raster)
    const { sizes } = labelRegions(
      10,
      10,
      (index) => !outline[index],
      () => true,
    )
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(MIN_REGION_SIZE)
  })
})

describe('quantize', () => {
  it('mengurutkan warna berdasarkan frekuensi', () => {
    expect(rankColors(['#000000', '#ffffff', '#ffffff'])).toEqual(['#ffffff', '#000000'])
  })

  it('membatasi jumlah warna ke warna terdekat', () => {
    const colors = ['#000000', '#000000', '#ffffff', '#ffffff', '#101010']
    const result = quantizeColors(colors, 2)
    expect(new Set(result).size).toBe(2)
    expect(result[4]).toBe('#000000')
    expect(quantizeColors(colors, 16)).toEqual(colors)
  })
})

import { describe, expect, it } from 'vitest'
import {
  absorbSmallDetails,
  MIN_ISLAND,
  OUTLINE_HEX,
  removeIslands,
  traceOutline,
  type Cell,
} from './outline'
import { rankColors, reducePalette } from './quantize'
import { fill, inkLayer, paint, plainPaint, rect, render, softPaint } from './raster'
import { labelRegions, neighbors } from './regions'

const RED = '#ff0000'
const WHITE = '#ffffff'
const B = OUTLINE_HEX

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

describe('traceOutline', () => {
  it('siluet subjek diberi garis hitam di sisi latar (termasuk diagonal)', () => {
    const raster = render(5, 5, [paint(rect(2, 2, 3, 3), RED)])
    const cells = traceOutline(raster)
    expect(cells[12]).toBe(RED)
    expect([6, 7, 8, 11, 13, 16, 17, 18].every((i) => cells[i] === B)).toBe(true)
    expect(cells[0]).toBeNull()
  })

  it('batas kontras antar-lapisan: kotak lapisan belakang menjadi hitam', () => {
    const raster = render(4, 1, [fill(WHITE), paint(rect(2, 0, 4, 1), RED)])
    expect(traceOutline(raster)).toEqual([WHITE, B, RED, RED])
  })

  it('gradasi halus, lapisan lembut, dan lapisan polos tidak diberi garis', () => {
    const subtle = render(2, 1, [fill('#ffffff'), paint(rect(1, 0, 2, 1), '#f6f6f6')])
    expect(traceOutline(subtle)).toEqual(['#ffffff', '#f6f6f6'])
    const bands = render(2, 1, [
      softPaint(rect(0, 0, 2, 1), WHITE),
      softPaint(rect(1, 0, 2, 1), RED),
    ])
    expect(traceOutline(bands)).toEqual([WHITE, RED])
    const blush = render(2, 1, [fill(WHITE), plainPaint(rect(1, 0, 2, 1), RED)])
    expect(traceOutline(blush)).toEqual([WHITE, RED])
    expect(traceOutline(subtle, 1)).toEqual([B, '#f6f6f6'])
  })

  it('tinta gelap menjadi hitam, tinta berwarna tetap warnanya', () => {
    const raster = render(3, 1, [
      fill(WHITE),
      inkLayer(rect(0, 0, 1, 1), '#2e2433'),
      { ...inkLayer(rect(2, 0, 3, 1), '#ffc0cb'), plain: true },
    ])
    expect(traceOutline(raster)).toEqual([B, WHITE, '#ffc0cb'])
  })
})

describe('absorbSmallDetails', () => {
  it('detail kecil diambil alih tetangga non-hitam, tanpa mengubah input', () => {
    const raster = render(4, 4, [fill(WHITE), paint(rect(1, 1, 2, 2), RED)])
    const result = absorbSmallDetails(raster)
    expect(result.colors.every((color) => color === WHITE)).toBe(true)
    expect(result.depth[5]).toBe(1)
    expect(raster.colors[5]).toBe(RED)
  })

  it('detail yang hanya bersebelahan dengan latar menjadi latar; tinta gelap dipertahankan', () => {
    const lone = render(3, 3, [paint(rect(1, 1, 2, 2), RED)])
    expect(absorbSmallDetails(lone).colors[4]).toBeNull()
    const eye = render(3, 3, [fill(WHITE), inkLayer(rect(1, 1, 2, 2), '#000000')])
    expect(absorbSmallDetails(eye).colors[4]).toBe('#000000')
  })

  it('region tanpa tetangga sama sekali dibiarkan', () => {
    const raster = render(1, 1, [paint(rect(0, 0, 1, 1), RED)])
    expect(absorbSmallDetails(raster).colors).toEqual([RED])
  })
})

describe('removeIslands', () => {
  it('pulau warna < MIN_ISLAND ikut warna tetangga terbanyak, hitam hanya bila terpaksa', () => {
    const cells: Cell[] = [WHITE, WHITE, WHITE, WHITE, RED, B, WHITE, WHITE, WHITE]
    expect(removeIslands(cells, 3, 3)[4]).toBe(WHITE)
    const boxed: Cell[] = [B, B, B, B, RED, B, B, B, B]
    expect(removeIslands(boxed, 3, 3)[4]).toBe(B)
    const floating: Cell[] = [null, null, null, null, RED, null, null, null, null]
    expect(removeIslands(floating, 3, 3)[4]).toBe(B)
  })

  it('hasil tanpa region warna < MIN_ISLAND', () => {
    const cells: Cell[] = [RED, RED, RED, WHITE, '#00ff00', RED, RED, RED, RED]
    const result = removeIslands(cells, 3, 3)
    const { sizes } = labelRegions(
      3,
      3,
      (i) => result[i] !== null && result[i] !== B,
      (a, b) => result[a] === result[b],
    )
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(MIN_ISLAND)
  })
})

describe('quantize', () => {
  it('mengurutkan warna berdasarkan frekuensi, tanpa hitam & latar', () => {
    expect(rankColors([B, WHITE, WHITE, RED, null])).toEqual([WHITE, RED])
  })

  it('membatasi jumlah warna dengan menggabungkan pasangan terdekat', () => {
    const cells: Cell[] = [WHITE, WHITE, '#f0f0f0', RED, RED, '#0000ff', B]
    const result = reducePalette(cells, 3)
    expect(rankColors(result)).toHaveLength(2)
    expect(result[2]).toBe(WHITE)
    expect(result[6]).toBe(B)
  })

  it('warna yang hampir sama selalu digabung, warna berbeda dibiarkan', () => {
    expect(reducePalette([WHITE, WHITE, '#fefefe'])).toEqual([WHITE, WHITE, WHITE])
    expect(reducePalette([WHITE, RED])).toEqual([WHITE, RED])
    expect(reducePalette([])).toEqual([])
  })
})

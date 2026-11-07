import { describe, expect, it } from 'vitest'
import type { Artwork } from '../types/artwork'
import {
  EMPTY_COLOR,
  OUTLINE_COLOR,
  codeAt,
  computePercent,
  isBackground,
  isOutline,
  outlineColor,
  referenceColor,
  resolveAllPixelColors,
  resolvePixelColor,
} from './pixelColors'

/** Grid 2×2: [latar, hitam, merah, biru]. */
const art: Artwork = {
  id: 'a',
  title: 'A',
  category: 'food',
  width: 2,
  height: 2,
  palette: [
    { code: '0', name: 'Hitam', hex: '#000000' },
    { code: '1', name: 'Merah', hex: '#ff0000' },
    { code: '2', name: 'Biru', hex: '#0000ff' },
  ],
  pixels: [-1, 0, 1, 2],
}

describe('helper kotak', () => {
  it('mengenali latar, garis tepi, dan kode', () => {
    expect([0, 1, 2, 3].map((i) => isBackground(art, i))).toEqual([true, false, false, false])
    expect([0, 1, 2, 3].map((i) => isOutline(art, i))).toEqual([false, true, false, false])
    expect([0, 1, 2, 3, 9].map((i) => codeAt(art, i))).toEqual([null, '0', '1', '2', null])
  })

  it('warna contoh per kotak, null untuk latar / di luar grid', () => {
    expect([0, 1, 2, 3, 9].map((i) => referenceColor(art, i))).toEqual([
      null,
      '#000000',
      '#ff0000',
      '#0000ff',
      null,
    ])
  })

  it('warna garis tepi dari palet kode 0, cadangan OUTLINE_COLOR', () => {
    expect(outlineColor({ ...art, palette: [{ code: '0', name: 'H', hex: '#111111' }] })).toBe(
      '#111111',
    )
    expect(outlineColor({ ...art, palette: art.palette.slice(1) })).toBe(OUTLINE_COLOR)
  })
})

describe('resolvePixelColor', () => {
  it('mode bebas: garis tepi terkunci hitam, sisanya warna user atau kosong', () => {
    expect(resolvePixelColor(art, [null, '#123456', null, null], 1, 'user')).toBe('#000000')
    expect(resolvePixelColor(art, [null, null, '#abcdef', null], 2, 'user')).toBe('#abcdef')
    expect(resolvePixelColor(art, ['#abcdef', null, null, null], 0, 'user')).toBe('#abcdef')
    expect(resolvePixelColor(art, undefined, 3, 'user')).toBe(EMPTY_COLOR)
  })

  it('mode nomor: garis tepi juga memakai warna user', () => {
    expect(resolvePixelColor(art, [null, null, null, null], 1, 'user', 'number')).toBe(EMPTY_COLOR)
    expect(resolvePixelColor(art, [null, '#000000', null, null], 1, 'user', 'number')).toBe(
      '#000000',
    )
  })

  it('tampilan contoh memakai warna palet, latar kosong', () => {
    expect(resolvePixelColor(art, undefined, 0, 'reference')).toBe(EMPTY_COLOR)
    expect(resolvePixelColor(art, undefined, 2, 'reference', 'number')).toBe('#ff0000')
  })

  it('resolveAllPixelColors memetakan semua kotak', () => {
    expect(resolveAllPixelColors(art, [null, null, '#abcdef', null], 'user')).toEqual([
      EMPTY_COLOR,
      '#000000',
      '#abcdef',
      EMPTY_COLOR,
    ])
    expect(resolveAllPixelColors(art, undefined, 'reference', 'number')).toEqual([
      EMPTY_COLOR,
      '#000000',
      '#ff0000',
      '#0000ff',
    ])
  })
})

describe('computePercent', () => {
  it('mode bebas: kotak non-latar & non-garis yang terisi (bawaan)', () => {
    expect(computePercent(art, ['#111111', '#111111', null, null])).toBe(0)
    expect(computePercent(art, [null, null, '#111111', null])).toBe(50)
    expect(computePercent(art, [null, null, '#1', '#2'], 'free')).toBe(100)
  })

  it('mode nomor: hanya kotak dengan warna benar, dihitung dari semua kotak non-latar', () => {
    expect(computePercent(art, [null, '#000000', '#FF0000', null], 'number')).toBe(67)
    expect(computePercent(art, ['#ff0000', '#ff0000', '#0000ff', null], 'number')).toBe(0)
    expect(computePercent(art, [null, '#000000', '#ff0000', '#0000ff'], 'number')).toBe(100)
  })

  it('0 jika tidak ada kotak yang dihitung', () => {
    const empty: Artwork = { ...art, pixels: [-1, 0, -1, 0] }
    expect(computePercent(empty, [null, null, null, null])).toBe(0)
    expect(computePercent({ ...art, pixels: [-1, -1, -1, -1] }, [], 'number')).toBe(0)
  })
})

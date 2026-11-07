import { describe, expect, it } from 'vitest'
import { computePercent } from '../render/pixelColors'
import type { Artwork } from '../types/artwork'
import {
  NUMBER_EMPTY_FILL,
  NUMBER_HIGHLIGHT_FILL,
  codeRegionIndices,
  fillCodeRegion,
  fillMatching,
  firstUnfinishedPalette,
  isCellCorrect,
  isNumberComplete,
  mismatchedIndices,
  numberDisplayColors,
  numberLabels,
  paletteIndexForKey,
  remainingByPalette,
} from './numberMode'
import { emptyColors, type PixelColors } from './tools'

/**
 * 4×3, '-' = latar:
 * r0: - 1 1 -
 * r1: 0 1 2 2
 * r2: 0 0 2 1
 */
const art: Artwork = {
  id: 'nomor-uji',
  title: 'Uji Nomor',
  category: 'animal',
  width: 4,
  height: 3,
  palette: [
    { code: '0', name: 'Hitam', hex: '#000000' },
    { code: '1', name: 'Merah', hex: '#FF0000' },
    { code: 'A', name: 'Hijau', hex: '#00ff00' },
  ],
  pixels: [-1, 1, 1, -1, 0, 1, 2, 2, 0, 0, 2, 1],
}
const RED = '#FF0000'
const filled = (colors: PixelColors) => colors.flatMap((c, i) => (c === null ? [] : [i]))
const solve = (): PixelColors => art.pixels.map((v) => (v < 0 ? null : art.palette[v].hex))

describe('fillMatching', () => {
  it('hanya mengisi kotak dengan kode yang sama, memakai hex palet', () => {
    const result = fillMatching(art, emptyColors(art), [0, 1, 2, 4, 6, 11], 1)
    expect(filled(result)).toEqual([1, 2, 11])
    expect(result[1]).toBe(RED)
  })

  it('kotak latar tidak bisa diisi', () => {
    const colors = emptyColors(art)
    expect(fillMatching(art, colors, [0, 3], 1)).toBe(colors)
  })

  it('tidak mengubah input; tanpa perubahan mengembalikan referensi sama', () => {
    const colors = emptyColors(art)
    const once = fillMatching(art, colors, [1], 1)
    expect(colors[1]).toBeNull()
    expect(fillMatching(art, once, [1, -1, 99, 1.5], 1)).toBe(once)
  })

  it('kotak yang terisi warna lain (bukan benar) diganti warna benar', () => {
    const colors = emptyColors(art).map((_, i) => (i === 1 ? '#123456' : null))
    expect(fillMatching(art, colors, [1], 1)[1]).toBe(RED)
  })
})

describe('mismatchedIndices', () => {
  it('melaporkan kotak kode lain yang belum benar, tanpa latar dan duplikat', () => {
    expect(mismatchedIndices(art, emptyColors(art), [0, 4, 4, 6, 1, 50], 1)).toEqual([4, 6])
  })

  it('kotak kode lain yang sudah benar tidak dilaporkan', () => {
    expect(mismatchedIndices(art, solve(), [4, 6], 1)).toEqual([])
  })
})

describe('isi area per kode', () => {
  it('codeRegionIndices mengikuti kotak berkode sama 4-arah', () => {
    expect(codeRegionIndices(art, 1).sort((a, b) => a - b)).toEqual([1, 2, 5])
    expect(codeRegionIndices(art, 11)).toEqual([11])
    expect(codeRegionIndices(art, 4).sort((a, b) => a - b)).toEqual([4, 8, 9])
    expect(codeRegionIndices(art, 0)).toEqual([])
    expect(codeRegionIndices(art, 12)).toEqual([])
  })

  it('fillCodeRegion mengisi area jika kodenya cocok, selain itu tidak berubah', () => {
    const colors = emptyColors(art)
    expect(filled(fillCodeRegion(art, colors, 5, 1))).toEqual([1, 2, 5])
    expect(fillCodeRegion(art, colors, 6, 1)).toBe(colors)
    expect(fillCodeRegion(art, colors, 0, 1)).toBe(colors)
    expect(fillCodeRegion(art, colors, -3, 1)).toBe(colors)
  })
})

describe('sisa, persen, selesai', () => {
  it('remainingByPalette menghitung kotak belum benar per kode', () => {
    const colors = fillMatching(art, emptyColors(art), [1, 2], 1)
    expect(remainingByPalette(art, emptyColors(art))).toEqual([3, 4, 3])
    expect(remainingByPalette(art, colors)).toEqual([3, 2, 3])
    expect(remainingByPalette(art, solve())).toEqual([0, 0, 0])
  })

  it('persen = kotak benar / kotak non-latar', () => {
    const colors = fillMatching(art, emptyColors(art), [1, 2, 5, 11], 1)
    expect(computePercent(art, colors, 'number')).toBe(40)
    const wrong = emptyColors(art).map((_, i) => (i === 4 ? RED : null))
    expect(computePercent(art, wrong, 'number')).toBe(0)
  })

  it('isNumberComplete hanya true jika semua kotak non-latar benar', () => {
    expect(isNumberComplete(art, emptyColors(art))).toBe(false)
    expect(isNumberComplete(art, solve())).toBe(true)
    const almost = solve().map((c, i) => (i === 11 ? null : c))
    expect(isNumberComplete(art, almost)).toBe(false)
    const onlyBackground = { ...art, width: 1, height: 1, pixels: [-1] }
    expect(isNumberComplete(onlyBackground, [null])).toBe(false)
  })

  it('firstUnfinishedPalette memilih kode pertama yang belum tuntas', () => {
    const blackDone = fillMatching(art, emptyColors(art), [4, 8, 9], 0)
    expect(firstUnfinishedPalette(art, emptyColors(art))).toBe(0)
    expect(firstUnfinishedPalette(art, blackDone)).toBe(1)
    expect(firstUnfinishedPalette(art, solve())).toBe(0)
  })

  it('isCellCorrect tidak peka huruf besar/kecil dan false untuk latar', () => {
    const colors = emptyColors(art).map((_, i) => (i === 1 ? '#ff0000' : null))
    expect(isCellCorrect(art, colors, 1)).toBe(true)
    expect(isCellCorrect(art, colors, 0)).toBe(false)
  })
})

describe('tampilan dan keyboard', () => {
  it('numberDisplayColors: benar = warna, kosong = putih, kode terpilih = highlight', () => {
    const colors = fillMatching(art, emptyColors(art), [1], 1)
    const view = numberDisplayColors(art, colors, 1)
    expect(view[0]).toBe(NUMBER_EMPTY_FILL)
    expect(view[1]).toBe(RED)
    expect(view[2]).toBe(NUMBER_HIGHLIGHT_FILL)
    expect(view[4]).toBe(NUMBER_EMPTY_FILL)
  })

  it('numberLabels: latar "·", kode disembunyikan setelah benar', () => {
    const colors = fillMatching(art, emptyColors(art), [1], 1)
    expect(numberLabels(art, colors).slice(0, 7)).toEqual(['·', '', '1', '·', '0', '1', 'A'])
  })

  it('paletteIndexForKey mencocokkan kode tanpa beda huruf', () => {
    expect(paletteIndexForKey(art, '1')).toBe(1)
    expect(paletteIndexForKey(art, 'a')).toBe(2)
    expect(paletteIndexForKey(art, '9')).toBeNull()
    expect(paletteIndexForKey(art, 'Enter')).toBeNull()
  })
})

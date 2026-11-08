import { isOutline } from '../render/pixelColors'
import { describe, expect, it } from 'vitest'
import { REGION_A, REGION_B, REGION_C, REGION_E, TEST_ARTWORK as art } from '../test/editorArtwork'
import {
  brushIndices,
  emptyColors,
  erase,
  floodFill,
  lineIndices,
  paintPixels,
  pickColor,
  regionIndices,
} from './tools'

const RED = '#ff0000'
const BLUE = '#0000ff'
const coloredAt = (colors: readonly (string | null)[]) =>
  colors.flatMap((c, i) => (c === null ? [] : [i]))

describe('floodFill', () => {
  it('mengisi tepat satu region dan berhenti di outline', () => {
    const result = floodFill(art, emptyColors(art), 7, RED)
    expect(coloredAt(result)).toEqual(REGION_A)
  })

  it('tidak bocor lewat diagonal', () => {
    const result = floodFill(art, emptyColors(art), 14, RED)
    expect(coloredAt(result)).toEqual(REGION_B)
    expect(REGION_A.concat(REGION_C).every((i) => result[i] === null)).toBe(true)
  })

  it('berhenti di tepi kanvas tanpa wrap ke baris lain', () => {
    expect(coloredAt(floodFill(art, emptyColors(art), 35, RED))).toEqual(REGION_E)
    expect(coloredAt(floodFill(art, emptyColors(art), 5, RED))).toEqual(REGION_C)
  })

  it('mengisi seluruh region walau sebagian sudah berwarna lain', () => {
    const start = paintPixels(art, emptyColors(art), [0], BLUE)
    const result = floodFill(art, start, 7, RED)
    expect(REGION_A.map((i) => result[i])).toEqual([RED, RED, RED, RED])
  })

  it('tidak pernah mengubah outline dan tidak memutasi input', () => {
    const input = emptyColors(art)
    const result = floodFill(art, input, 30, RED)
    expect(input.every((c) => c === null)).toBe(true)
    expect(result.every((color, i) => !isOutline(art, i) || color === null)).toBe(true)
  })

  it('klik di outline atau di luar kanvas = tidak berubah', () => {
    const input = emptyColors(art)
    expect(floodFill(art, input, 2, RED)).toBe(input)
    expect(floodFill(art, input, -1, RED)).toBe(input)
    expect(floodFill(art, input, 999, RED)).toBe(input)
    expect(regionIndices(art, 2)).toEqual([])
  })

  it('region yang sudah berwarna sama mengembalikan array yang sama', () => {
    const filled = floodFill(art, emptyColors(art), 0, RED)
    expect(floodFill(art, filled, 1, RED)).toBe(filled)
  })
})

describe('paintPixels / erase / pickColor', () => {
  it('mewarnai pixel non-outline dan mengabaikan outline', () => {
    const input = emptyColors(art)
    const result = paintPixels(art, input, [0, 2, 3], RED)
    expect(coloredAt(result)).toEqual([0])
    expect(result).not.toBe(input)
    expect(input[0]).toBeNull()
  })

  it('erase menghapus warna, pixel kosong tidak berubah', () => {
    const painted = paintPixels(art, emptyColors(art), [0, 1], RED)
    const erased = erase(art, painted, [0])
    expect(coloredAt(erased)).toEqual([1])
    expect(erase(art, erased, [0])).toBe(erased)
  })

  it('pickColor mengambil warna user, null untuk kosong/outline/luar kanvas', () => {
    const painted = paintPixels(art, emptyColors(art), [0], RED)
    expect(pickColor(art, painted, 0)).toBe(RED)
    expect(pickColor(art, painted, 1)).toBeNull()
    expect(pickColor(art, painted, 2)).toBeNull()
    expect(pickColor(art, painted, 99)).toBeNull()
  })
})

describe('brushIndices', () => {
  it('ukuran 1 hanya pixel itu', () => {
    expect(brushIndices(art, 14, 1)).toEqual([14])
  })

  it('ukuran 2 = pixel + kanan + bawah, terpotong di tepi', () => {
    expect(brushIndices(art, 14, 2)).toEqual([14, 15, 20, 21])
    expect(brushIndices(art, 35, 2)).toEqual([35])
    expect(brushIndices(art, 5, 2)).toEqual([5, 11])
  })

  it('ukuran 3 = 3×3 di sekitar pixel, terpotong di pojok', () => {
    expect(brushIndices(art, 14, 3)).toEqual([7, 8, 9, 13, 14, 15, 19, 20, 21])
    expect(brushIndices(art, 0, 3)).toEqual([0, 1, 6, 7])
  })

  it('kuas besar di dekat outline tidak mewarnai outline', () => {
    const result = paintPixels(art, emptyColors(art), brushIndices(art, 7, 3), RED)
    expect(coloredAt(result)).toEqual([0, 1, 6, 7, 14])
  })
})

describe('lineIndices', () => {
  it('menghubungkan dua pixel tanpa celah', () => {
    expect(lineIndices(art, 30, 35)).toEqual([30, 31, 32, 33, 34, 35])
    expect(lineIndices(art, 35, 0)).toEqual([35, 28, 21, 14, 7, 0])
    expect(lineIndices(art, 0, 0)).toEqual([0])
    expect(lineIndices(art, 0, 13)).toEqual([0, 7, 13])
  })
})

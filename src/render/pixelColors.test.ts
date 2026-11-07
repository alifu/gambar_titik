import { describe, expect, it } from 'vitest'
import type { Artwork } from '../types/artwork'
import {
  EMPTY_COLOR,
  OUTLINE_COLOR,
  computePercent,
  resolveAllPixelColors,
  resolvePixelColor,
} from './pixelColors'

const art: Artwork = {
  id: 'test-01',
  title: 'Uji',
  category: 'food',
  width: 2,
  height: 2,
  outline: [true, false, false, false],
  reference: ['#000000', '#ff0000', '#00ff00', '#0000ff'],
  suggestedPalette: ['#ff0000', '#00ff00', '#0000ff'],
}

describe('resolvePixelColor', () => {
  it('always returns outline color for outline pixels', () => {
    expect(resolvePixelColor(art, ['#123456', null, null, null], 0, 'user')).toBe(OUTLINE_COLOR)
    expect(resolvePixelColor(art, undefined, 0, 'reference')).toBe(OUTLINE_COLOR)
  })

  it('returns reference color in reference mode', () => {
    expect(resolvePixelColor(art, undefined, 1, 'reference')).toBe('#ff0000')
  })

  it('returns user color or empty color in user mode', () => {
    expect(resolvePixelColor(art, [null, '#abcdef', null, null], 1, 'user')).toBe('#abcdef')
    expect(resolvePixelColor(art, [null, null, null, null], 2, 'user')).toBe(EMPTY_COLOR)
    expect(resolvePixelColor(art, undefined, 3, 'user')).toBe(EMPTY_COLOR)
  })
})

describe('resolveAllPixelColors', () => {
  it('resolves every pixel', () => {
    expect(resolveAllPixelColors(art, [null, '#abcdef', null, null], 'user')).toEqual([
      OUTLINE_COLOR,
      '#abcdef',
      EMPTY_COLOR,
      EMPTY_COLOR,
    ])
  })
})

describe('computePercent', () => {
  it('ignores outline pixels and rounds', () => {
    expect(computePercent(art, ['#111111', null, null, null])).toBe(0)
    expect(computePercent(art, [null, '#111111', null, null])).toBe(33)
    expect(computePercent(art, [null, '#1', '#2', '#3'])).toBe(100)
  })

  it('returns 0 when nothing is fillable', () => {
    const allOutline = { ...art, outline: [true, true, true, true] }
    expect(computePercent(allOutline, [null, null, null, null])).toBe(0)
  })
})

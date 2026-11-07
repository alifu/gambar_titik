import { describe, expect, it } from 'vitest'
import { RECENT_COLORS_LIMIT, addRecentColor, isStoredHex, normalizeHex } from './color'

describe('normalizeHex', () => {
  it.each([
    ['#abc', '#aabbcc'],
    ['ABC', '#aabbcc'],
    ['ABCDEF', '#abcdef'],
    ['#FF8800', '#ff8800'],
    ['  #12a4Bc ', '#12a4bc'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeHex(input)).toBe(expected)
  })

  it.each(['', '#', '#ab', '#abcd', '#ggg', 'red', '#1234567', '##abc'])(
    'input invalid %s → null',
    (input) => {
      expect(normalizeHex(input)).toBeNull()
    },
  )
})

describe('isStoredHex', () => {
  it('hanya menerima #rrggbb huruf kecil', () => {
    expect(isStoredHex('#a1b2c3')).toBe(true)
    expect(isStoredHex('#A1B2C3')).toBe(false)
    expect(isStoredHex('a1b2c3')).toBe(false)
    expect(isStoredHex('#abc')).toBe(false)
  })
})

describe('addRecentColor', () => {
  it('menaruh warna terbaru di depan tanpa duplikat', () => {
    expect(addRecentColor(['#111111', '#222222'], '#222222')).toEqual(['#222222', '#111111'])
    expect(addRecentColor([], '#333333')).toEqual(['#333333'])
  })

  it('tidak berubah jika warna sudah paling depan', () => {
    const list = ['#111111']
    expect(addRecentColor(list, '#111111')).toBe(list)
  })

  it('maksimal 12 warna', () => {
    const many = Array.from({ length: RECENT_COLORS_LIMIT }, (_, i) => `#0000${10 + i}`)
    const result = addRecentColor(many, '#ffffff')
    expect(result).toHaveLength(RECENT_COLORS_LIMIT)
    expect(result[0]).toBe('#ffffff')
    expect(result).not.toContain(many[RECENT_COLORS_LIMIT - 1])
  })
})

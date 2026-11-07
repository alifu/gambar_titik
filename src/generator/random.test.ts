import { describe, expect, it } from 'vitest'
import { chance, createRng, deriveSeed, int, pick, range } from './random'

describe('random', () => {
  it('menghasilkan urutan yang sama untuk seed yang sama', () => {
    const a = createRng(42)
    const b = createRng(42)
    expect(Array.from({ length: 5 }, a.next)).toEqual(Array.from({ length: 5 }, b.next))
  })

  it('menghasilkan urutan berbeda untuk seed berbeda dan nilai di [0, 1)', () => {
    const values = Array.from({ length: 200 }, createRng(1).next)
    expect(values).not.toEqual(Array.from({ length: 200 }, createRng(2).next))
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true)
  })

  it('deriveSeed stabil dan peka terhadap kunci', () => {
    expect(deriveSeed(7, 'animal-cat-01')).toBe(deriveSeed(7, 'animal-cat-01'))
    expect(deriveSeed(7, 'animal-cat-01')).not.toBe(deriveSeed(7, 'animal-cat-02'))
    expect(deriveSeed(7, 'x')).not.toBe(deriveSeed(8, 'x'))
  })

  it('helper range, int, pick, chance tetap dalam batas', () => {
    const rng = createRng(99)
    for (let i = 0; i < 100; i++) {
      const value = range(rng, 2, 5)
      expect(value).toBeGreaterThanOrEqual(2)
      expect(value).toBeLessThan(5)
      expect([1, 2, 3]).toContain(int(rng, 1, 3))
      expect(['a', 'b']).toContain(pick(rng, ['a', 'b']))
    }
    expect(chance(rng, 0)).toBe(false)
    expect(chance(rng, 1)).toBe(true)
  })

  it('pick menolak daftar kosong', () => {
    expect(() => pick(createRng(1), [])).toThrow()
  })
})

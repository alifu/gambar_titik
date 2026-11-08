import { describe, expect, it } from 'vitest'
import { COLOR_NAMES, nameColors, OUTLINE_NAME } from './colorNames'

describe('nameColors', () => {
  it('memberi nama Bahasa Indonesia terdekat', () => {
    expect(nameColors(['#e53935', '#4caf50', '#ffffff', '#f8e7c4', '#8fd3ff'])).toEqual([
      'Merah',
      'Hijau',
      'Putih',
      'Krem',
      'Biru Langit',
    ])
    expect(nameColors(['#f6c6d3'])[0]).toMatch(/^Merah Muda/)
  })

  it('nama unik dalam satu palet: varian terdekat, lalu nomor', () => {
    const names = nameColors(['#e53935', '#e43834', '#e63a36', '#e53936'])
    expect(new Set(names).size).toBe(4)
    expect(names[0]).toBe('Merah')
    expect(names.some((name) => /^Merah \d$/.test(name))).toBe(true)
  })

  it('bentrok tanpa nama dekat lain → varian Muda/Tua', () => {
    expect(nameColors(['#3cbfae', '#3cbfaf'])).toEqual([
      'Toska',
      expect.stringMatching(/^Toska (Muda|Tua)$/),
    ])
  })

  it('hitam disimpan untuk garis tepi', () => {
    expect(COLOR_NAMES.some((entry) => entry.name === OUTLINE_NAME)).toBe(false)
    expect(nameColors(['#050505'])[0]).not.toBe(OUTLINE_NAME)
  })
})

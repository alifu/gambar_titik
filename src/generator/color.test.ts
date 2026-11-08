import { describe, expect, it } from 'vitest'
import {
  colorDistance,
  hexToLab,
  darken,
  hexToRgb,
  isHexColor,
  lighten,
  mix,
  rgbToHex,
} from './color'

describe('color', () => {
  it('mengonversi hex ↔ rgb', () => {
    expect(hexToRgb('#ff8000')).toEqual([255, 128, 0])
    expect(rgbToHex([255, 128, 0])).toBe('#ff8000')
    expect(rgbToHex([300, -5, 12.4])).toBe('#ff000c')
  })

  it('mencampur, mencerahkan, dan menggelapkan warna', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(lighten('#000000', 1)).toBe('#ffffff')
    expect(darken('#ffffff', 1)).toBe('#000000')
  })

  it('memvalidasi hex dan menghitung jarak', () => {
    expect(isHexColor('#a1b2c3')).toBe(true)
    expect(isHexColor('#A1B2C3')).toBe(false)
    expect(isHexColor('red')).toBe(false)
    expect(isHexColor(12)).toBe(false)
    expect(colorDistance('#123456', '#123456')).toBe(0)
    expect(colorDistance('#000000', '#ffffff')).toBeCloseTo(100, 0)
    expect(colorDistance('#000000', '#ffffff')).toBeGreaterThan(colorDistance('#000000', '#101010'))
    expect(hexToLab('#ffffff')[0]).toBeCloseTo(100, 0)
  })
})

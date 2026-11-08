import { describe, expect, it } from 'vitest'
import {
  below,
  capsule,
  circle,
  curve,
  detailLine,
  ellipse,
  fill,
  IDENTITY_VIEW,
  inkLayer,
  intersect,
  mirrorX,
  paint,
  plainPaint,
  polar,
  polygon,
  rect,
  render,
  roundRect,
  sector,
  softPaint,
  subtract,
  symmetric,
  topLayer,
  translate,
  union,
} from './raster'

const countInside = (shape: (x: number, y: number) => boolean, size = 16) =>
  render(size, size, [paint(shape, '#000000')]).colors.filter((color) => color === '#000000').length

describe('raster primitives', () => {
  it('lingkaran dan elips', () => {
    expect(circle(8, 8, 3)(8, 8)).toBe(true)
    expect(circle(8, 8, 3)(12, 8)).toBe(false)
    expect(ellipse(8, 8, 6, 2)(13, 8)).toBe(true)
    expect(ellipse(8, 8, 6, 2)(8, 11)).toBe(false)
    expect(ellipse(8, 8, 6, 2, Math.PI / 2)(8, 13)).toBe(true)
  })

  it('persegi, persegi bulat, poligon', () => {
    expect(countInside(rect(2, 2, 6, 6))).toBe(16)
    expect(roundRect(0, 0, 10, 10, 3)(0.2, 0.2)).toBe(false)
    expect(roundRect(0, 0, 10, 10, 3)(5, 5)).toBe(true)
    expect(roundRect(0, 0, 10, 10, 3)(11, 5)).toBe(false)
    const triangle = polygon([
      [0, 0],
      [10, 0],
      [0, 10],
    ])
    expect(triangle(2, 2)).toBe(true)
    expect(triangle(8, 8)).toBe(false)
  })

  it('garis tebal dan kurva', () => {
    expect(capsule([0, 0], [10, 0], 1)(5, 0.5)).toBe(true)
    expect(capsule([0, 0], [10, 0], 1)(5, 2)).toBe(false)
    expect(capsule([3, 3], [3, 3], 1)(3.5, 3)).toBe(true)
    expect(curve([0, 0], [5, 10], [10, 0], 1)(5, 5)).toBe(true)
  })

  it('bentuk polar, juring, dan ketinggian', () => {
    expect(polar(8, 8, () => 3)(9, 9)).toBe(true)
    expect(sector(0, 0, 10, 0, Math.PI / 2)(3, 3)).toBe(true)
    expect(sector(0, 0, 10, 0, Math.PI / 2)(-3, 3)).toBe(false)
    expect(sector(0, 0, 10, 0, Math.PI / 2)(20, 20)).toBe(false)
    const hill = below([5, 5, 2])
    expect(hill(0.5, 6)).toBe(true)
    expect(hill(2.5, 3)).toBe(true)
    expect(hill(9, 1)).toBe(false)
  })

  it('kombinasi bentuk', () => {
    const a = rect(0, 0, 4, 4)
    const b = rect(2, 0, 6, 4)
    expect(union(a, b)(5, 1)).toBe(true)
    expect(intersect(a, b)(1, 1)).toBe(false)
    expect(subtract(a, b)(1, 1)).toBe(true)
    expect(subtract(a, b)(3, 1)).toBe(false)
    expect(mirrorX(a, 8)(14, 1)).toBe(true)
    expect(symmetric(a, 8)(1, 1) && symmetric(a, 8)(14, 1)).toBe(true)
    expect(translate(a, 10, 0)(11, 1)).toBe(true)
  })
})

describe('render', () => {
  it('menggambar lapisan berurutan tanpa mengubah input', () => {
    const layers = [
      fill('#ffffff'),
      paint(rect(0, 0, 2, 2), '#ff0000'),
      inkLayer(rect(0, 0, 1, 1), '#000000'),
    ]
    const raster = render(4, 4, layers)
    expect(raster.colors).toHaveLength(16)
    expect(raster.colors[0]).toBe('#000000')
    expect(raster.ink[0]).toBe(true)
    expect(raster.colors[1]).toBe('#ff0000')
    expect(raster.depth[1]).toBe(2)
    expect(raster.colors[15]).toBe('#ffffff')
    expect(layers).toHaveLength(3)
  })

  it('kotak tanpa lapisan menjadi latar (null)', () => {
    const raster = render(2, 1, [paint(rect(0, 0, 1, 1), '#ff0000')])
    expect(raster.colors).toEqual(['#ff0000', null])
    expect(raster.depth).toEqual([1, 0])
  })

  it('supersampling memakai lapisan terluas, tinta tipis tetap menang', () => {
    const layers = [
      fill('#ffffff'),
      paint(rect(0, 0, 0.3, 1), '#ff0000'),
      inkLayer(rect(1, 0, 1.3, 1), '#000000'),
    ]
    const raster = render(2, 1, layers, IDENTITY_VIEW, 4)
    expect(raster.colors).toEqual(['#ffffff', '#000000'])
  })

  it('view memetakan kotak ke koordinat desain', () => {
    const view = { x0: 10, y0: 0, scaleX: 2, scaleY: 2 }
    const raster = render(2, 1, [paint(rect(12, 0, 14, 2), '#ff0000')], view)
    expect(raster.colors).toEqual([null, '#ff0000'])
  })

  it('menandai lapisan lembut dan polos', () => {
    const raster = render(3, 1, [
      softPaint(rect(0, 0, 1, 1), '#111111'),
      plainPaint(rect(1, 0, 2, 1), '#222222'),
      detailLine(rect(2, 0, 3, 1), '#333333'),
    ])
    expect(raster.soft).toEqual([true, false, false])
    expect(raster.plain).toEqual([false, true, true])
    expect(raster.ink).toEqual([false, false, true])
  })

  it('topLayer mengembalikan lapisan paling depan (1-based)', () => {
    const layers = [fill('#ffffff'), paint(rect(0, 0, 1, 1), '#ff0000')]
    expect(topLayer(layers, 0.5, 0.5)).toBe(2)
    expect(topLayer(layers, 5, 5)).toBe(1)
    expect(topLayer([], 0, 0)).toBe(0)
  })
})

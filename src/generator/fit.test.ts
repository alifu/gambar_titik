import { describe, expect, it } from 'vitest'
import { coverDesign, designBounds, fitSubject } from './fit'
import { paint, rect, render } from './raster'

describe('fit', () => {
  it('kotak pembatas desain', () => {
    const bounds = designBounds([paint(rect(10, 20, 30, 40), '#ff0000')])
    expect(bounds).toEqual({ minX: 10.25, minY: 20.25, maxX: 29.75, maxY: 39.75 })
    expect(designBounds([])).toBeNull()
  })

  it('subjek memenuhi grid dengan sisa margin, rasio tetap', () => {
    const layers = [paint(rect(10, 20, 30, 40), '#ff0000')]
    const view = fitSubject(layers, 10, 10, 1)
    expect(view.scaleX).toBeCloseTo(2.5)
    expect(view.scaleY).toBe(view.scaleX)
    const colors = render(10, 10, layers, view).colors
    expect(colors[0]).toBeNull()
    expect(colors[11]).toBe('#ff0000')
    expect(colors[88]).toBe('#ff0000')
    expect(fitSubject([], 10, 10, 1)).toEqual({ x0: 0, y0: 0, scaleX: 1, scaleY: 1 })
  })

  it('cover memotong desain lebar secara simetris', () => {
    expect(coverDesign(48, 40, 96, 64, 1.8)).toEqual({
      x0: (96 - 48 * 1.8) / 2,
      y0: 0,
      scaleX: 1.8,
      scaleY: 1.6,
    })
  })
})

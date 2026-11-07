import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { galleryPathWithQuery, rememberGalleryQuery } from './galleryPath'

describe('galleryPath', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the plain path when nothing was remembered', () => {
    expect(galleryPathWithQuery()).toBe('/galeri')
  })

  it('remembers and clears the last filter query', () => {
    rememberGalleryQuery('?q=kucing')
    expect(galleryPathWithQuery()).toBe('/galeri?q=kucing')
    rememberGalleryQuery('')
    expect(galleryPathWithQuery()).toBe('/galeri')
  })

  it('ignores a malformed stored value', () => {
    sessionStorage.setItem('gambar-titik:gallery-query', 'javascript:alert(1)')
    expect(galleryPathWithQuery()).toBe('/galeri')
  })

  it('does not throw when sessionStorage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => rememberGalleryQuery('?q=a')).not.toThrow()
    expect(galleryPathWithQuery()).toBe('/galeri')
  })
})

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TEST_ARTWORKS } from '../test/galleryFixtures'
import { loadArtworks } from './artworks'
import { useArtworks, usePixelCountLookup } from './useArtworks'

vi.mock('./artworks', () => ({ loadArtworks: vi.fn() }))
const load = vi.mocked(loadArtworks)

describe('useArtworks', () => {
  beforeEach(() => {
    load.mockReset()
  })

  it('loads artworks successfully', async () => {
    load.mockResolvedValue(TEST_ARTWORKS)
    const { result } = renderHook(() => useArtworks())
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.artworks).toBe(TEST_ARTWORKS)
  })

  it('reports an error and recovers on retry', async () => {
    load.mockRejectedValueOnce(new Error('Gagal memuat'))
    load.mockResolvedValueOnce(TEST_ARTWORKS)
    const { result } = renderHook(() => useArtworks())
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('Gagal memuat')

    act(() => result.current.retry())
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.error).toBeNull()
  })
})

describe('usePixelCountLookup', () => {
  beforeEach(() => {
    load.mockReset()
  })

  it('is undefined until ready, then returns width * height', async () => {
    load.mockResolvedValue(TEST_ARTWORKS)
    const { result } = renderHook(() => usePixelCountLookup())
    expect(result.current.lookup).toBeUndefined()
    await waitFor(() => expect(result.current.lookup).toBeDefined())
    expect(result.current.lookup?.('animal-1')).toBe(4)
    expect(result.current.lookup?.('nope')).toBeUndefined()
  })

  it('exposes the error and stays undefined on failure', async () => {
    load.mockRejectedValueOnce(new Error('rusak'))
    const { result } = renderHook(() => usePixelCountLookup())
    await waitFor(() => expect(result.current.error).toBe('rusak'))
    expect(result.current.lookup).toBeUndefined()
  })
})

describe('usePixelCountLookup with a persistent rejection', () => {
  beforeEach(() => {
    load.mockReset()
  })

  it('settles on the error without re-requesting or looping', async () => {
    // Rejection persisten: dulu bocor karena `beforeEach(() => load.mockReset())` mengembalikan mock,
    // dan vitest memanggil nilai kembalian hook sebagai cleanup (memicu unhandled rejection).
    load.mockRejectedValue(new Error('rusak terus'))
    const { result } = renderHook(() => usePixelCountLookup())
    await waitFor(() => expect(result.current.error).toBe('rusak terus'))
    expect(result.current.lookup).toBeUndefined()
    expect(load).toHaveBeenCalledTimes(1)
  })
})

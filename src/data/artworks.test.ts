import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Artwork } from '../types/artwork'
import { encodeArtworks } from './codec'

const SAMPLE: Artwork = {
  id: 'animal-cat-01',
  title: 'Kucing Oranye',
  category: 'animal',
  width: 2,
  height: 2,
  palette: [
    { code: '0', name: 'Hitam', hex: '#000000' },
    { code: '1', name: 'Oranye', hex: '#ff9900' },
  ],
  pixels: [0, 1, -1, 1],
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

async function freshLoader() {
  vi.resetModules()
  return import('./artworks')
}

describe('loadArtworks', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('memuat, mendekode, dan menyimpan cache di memori', async () => {
    fetchMock.mockResolvedValue(jsonResponse(encodeArtworks([SAMPLE])))
    const { loadArtworks, ARTWORKS_URL } = await freshLoader()
    const first = await loadArtworks()
    const second = await loadArtworks()
    expect(first).toEqual([SAMPLE])
    expect(second).toBe(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(ARTWORKS_URL)
    expect(ARTWORKS_URL).toBe('/data/artworks.json')
  })

  it('getArtworkById mencari gambar berdasarkan ID', async () => {
    fetchMock.mockResolvedValue(jsonResponse(encodeArtworks([SAMPLE])))
    const { getArtworkById } = await freshLoader()
    expect(await getArtworkById('animal-cat-01')).toEqual(SAMPLE)
    expect(await getArtworkById('tidak-ada')).toBeUndefined()
  })

  it('error jaringan → pesan jelas, lalu bisa dicoba lagi', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'))
    fetchMock.mockResolvedValueOnce(jsonResponse(encodeArtworks([SAMPLE])))
    const { loadArtworks } = await freshLoader()
    await expect(loadArtworks()).rejects.toThrow(
      'Gagal memuat data gambar. Periksa koneksi lalu coba lagi.',
    )
    await expect(loadArtworks()).resolves.toHaveLength(1)
  })

  it('status HTTP gagal → pesan dengan status', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 404))
    const { loadArtworks } = await freshLoader()
    await expect(loadArtworks()).rejects.toThrow('Gagal memuat data gambar (status 404).')
  })

  it('JSON tidak valid ditolak', async () => {
    fetchMock.mockResolvedValue(new Response('{bukan json', { status: 200 }))
    const { loadArtworks } = await freshLoader()
    await expect(loadArtworks()).rejects.toThrow('Data gambar tidak bisa dibaca')
  })

  it('bentuk data rusak ditolak', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ version: 2, artworks: [{ id: 'x' }] }))
    const { loadArtworks } = await freshLoader()
    await expect(loadArtworks()).rejects.toThrow(/Data gambar rusak/)
  })
})

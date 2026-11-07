import type { Artwork } from '../types/artwork.ts'
import { ArtworkDataError } from './codec.ts'
import { decodeArtworks } from './decode.ts'

export const ARTWORKS_URL = `${import.meta.env.BASE_URL}data/artworks.json`

let cache: Promise<readonly Artwork[]> | null = null

async function fetchArtworks(): Promise<readonly Artwork[]> {
  let response: Response
  try {
    response = await fetch(ARTWORKS_URL)
  } catch {
    throw new ArtworkDataError('Gagal memuat data gambar. Periksa koneksi lalu coba lagi.')
  }
  if (!response.ok) {
    throw new ArtworkDataError(`Gagal memuat data gambar (status ${response.status}).`)
  }
  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new ArtworkDataError('Data gambar tidak bisa dibaca (bukan JSON yang valid).')
  }
  return Object.freeze(decodeArtworks(data))
}

/** Muat semua gambar sekali, lalu pakai hasil cache di memori. Gagal → cache dikosongkan agar bisa dicoba lagi. */
export function loadArtworks(): Promise<readonly Artwork[]> {
  if (cache === null) {
    cache = fetchArtworks().catch((error: unknown) => {
      cache = null
      throw error
    })
  }
  return cache
}

export async function getArtworkById(id: string): Promise<Artwork | undefined> {
  const artworks = await loadArtworks()
  return artworks.find((artwork) => artwork.id === id)
}

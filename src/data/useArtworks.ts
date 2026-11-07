import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PixelCountLookup } from '../storage/exportImport'
import type { Artwork } from '../types/artwork'
import { loadArtworks } from './artworks'

export type ArtworksState =
  | { readonly status: 'loading'; readonly artworks: readonly Artwork[]; readonly error: null }
  | { readonly status: 'ready'; readonly artworks: readonly Artwork[]; readonly error: null }
  | { readonly status: 'error'; readonly artworks: readonly Artwork[]; readonly error: string }

export type UseArtworksResult = ArtworksState & { readonly retry: () => void }

const NO_ARTWORKS: readonly Artwork[] = []
const LOADING: ArtworksState = { status: 'loading', artworks: NO_ARTWORKS, error: null }

/** Muat semua gambar; `retry` mengulang pemuatan setelah gagal. */
export function useArtworks(): UseArtworksResult {
  const [state, setState] = useState<ArtworksState>(LOADING)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    loadArtworks()
      .then((artworks) => active && setState({ status: 'ready', artworks, error: null }))
      .catch(
        (e: Error) =>
          active && setState({ status: 'error', artworks: NO_ARTWORKS, error: e.message }),
      )
    return () => {
      active = false
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState(LOADING)
    setAttempt((n) => n + 1)
  }, [])

  return { ...state, retry }
}

/** Lookup jumlah pixel (width * height) per ID gambar, undefined jika tidak dikenal. */
export function buildPixelCountLookup(artworks: readonly Artwork[]): PixelCountLookup {
  const counts = new Map(artworks.map((a) => [a.id, a.width * a.height]))
  return (artId) => counts.get(artId)
}

/** `lookup` bernilai undefined selama data gambar belum siap. */
export function usePixelCountLookup(): {
  readonly lookup: PixelCountLookup | undefined
  readonly error: string | null
} {
  const { status, artworks, error } = useArtworks()
  const lookup = useMemo(
    () => (status === 'ready' ? buildPixelCountLookup(artworks) : undefined),
    [status, artworks],
  )
  return { lookup, error }
}

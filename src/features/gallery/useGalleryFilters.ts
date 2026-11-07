import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { rememberGalleryQuery } from './galleryPath'
import {
  DEFAULT_FILTERS,
  type CategoryFilter,
  type GalleryFilters,
  type StatusFilter,
} from './filterArtworks'

const CATEGORY_PARAM: Readonly<Record<CategoryFilter, string>> = {
  all: '',
  scenery: 'pemandangan',
  animal: 'hewan',
  food: 'makanan',
}
const STATUS_PARAM: Readonly<Record<StatusFilter, string>> = {
  all: '',
  inProgress: 'sedang',
  done: 'selesai',
}

function fromParam<T extends string>(
  map: Readonly<Record<T, string>>,
  value: string | null,
  fallback: T,
): T {
  const found = (Object.keys(map) as T[]).find((key) => map[key] !== '' && map[key] === value)
  return found ?? fallback
}

/** Filter galeri yang disimpan di query URL (?kategori=hewan&status=selesai&q=kucing). */
export function useGalleryFilters(): readonly [
  GalleryFilters,
  (patch: Partial<GalleryFilters>) => void,
] {
  const [params, setParams] = useSearchParams()
  const kategori = params.get('kategori')
  const status = params.get('status')
  const q = params.get('q')

  const filters = useMemo<GalleryFilters>(
    () => ({
      category: fromParam(CATEGORY_PARAM, kategori, DEFAULT_FILTERS.category),
      status: fromParam(STATUS_PARAM, status, DEFAULT_FILTERS.status),
      query: q ?? '',
    }),
    [kategori, status, q],
  )

  const search = params.toString()
  useEffect(() => {
    rememberGalleryQuery(search ? `?${search}` : '')
  }, [search])

  const update = useCallback(
    (patch: Partial<GalleryFilters>) => {
      const next = { ...filters, ...patch }
      const entries: readonly (readonly [string, string])[] = [
        ['kategori', CATEGORY_PARAM[next.category]],
        ['status', STATUS_PARAM[next.status]],
        ['q', next.query],
      ]
      setParams(
        new URLSearchParams(Object.fromEntries(entries.filter(([, value]) => value !== ''))),
        { replace: true },
      )
    },
    [filters, setParams],
  )

  return [filters, update]
}

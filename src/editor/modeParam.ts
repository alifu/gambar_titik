import type { ColoringMode, Progress } from '../types/progress'

/** Nama query string untuk mode di route editor: `/warnai/:artId?mode=nomor|bebas`. */
export const MODE_PARAM = 'mode'
/** Mode untuk gambar yang belum pernah diwarnai. */
export const DEFAULT_MODE: ColoringMode = 'number'

const PARAM_BY_MODE: Readonly<Record<ColoringMode, string>> = { number: 'nomor', free: 'bebas' }

/** `nomor` → 'number', `bebas` → 'free'; nilai lain (atau kosong) → null. */
export function parseModeParam(value: string | null): ColoringMode | null {
  if (value === PARAM_BY_MODE.number) return 'number'
  if (value === PARAM_BY_MODE.free) return 'free'
  return null
}

export function modeParamValue(mode: ColoringMode): string {
  return PARAM_BY_MODE[mode]
}

/** Path editor. Tanpa `mode` = mode terakhir yang dipakai untuk gambar itu. */
export function editorPath(artId: string, mode?: ColoringMode): string {
  const base = `/warnai/${artId}`
  return mode ? `${base}?${MODE_PARAM}=${modeParamValue(mode)}` : base
}

/** Progres yang paling baru diubah dari beberapa mode (undefined jika tidak ada). */
export function latestOf(list: readonly (Progress | undefined)[]): Progress | undefined {
  return list.reduce<Progress | undefined>(
    (best, item) => (item && (!best || item.updatedAt > best.updatedAt) ? item : best),
    undefined,
  )
}

/** Mode yang dipakai: dari URL; jika tidak ada, mode progres terbaru; jika belum ada, DEFAULT_MODE. */
export function resolveMode(
  requested: ColoringMode | null,
  latest: Progress | undefined,
): ColoringMode {
  return requested ?? latest?.mode ?? DEFAULT_MODE
}

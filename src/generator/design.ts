import type { Layer } from './raster.ts'
import type { Rng } from './random.ts'

/** Warna garis tinta untuk detail kecil (mata, mulut, kumis). */
export const INK = '#2e2433'
export const WHITE = '#ffffff'

export interface Design {
  readonly title: string
  readonly layers: readonly Layer[]
}

/** Satu jenis subjek (mis. kucing) yang menghasilkan `count` variasi gambar. */
export interface Subject {
  readonly key: string
  readonly count: number
  readonly create: (rng: Rng, variant: number) => Design
}

/** Ambil variasi berdasarkan indeks secara melingkar. */
export function variantOf<T>(items: readonly T[], variant: number): T {
  return items[variant % items.length]
}

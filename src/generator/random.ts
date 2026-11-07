/** Generator angka acak ber-seed (mulberry32). State hanya hidup di dalam closure milik instance. */
export interface Rng {
  readonly next: () => number
}

const UINT32_RANGE = 4294967296
const FNV_OFFSET = 2166136261
const FNV_PRIME = 16777619

export function createRng(seed: number): Rng {
  let state = seed >>> 0
  return {
    next: () => {
      state = (state + 0x6d2b79f5) >>> 0
      let t = state
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE
    },
  }
}

/** Turunkan seed baru yang stabil dari seed dasar + kunci teks (FNV-1a). */
export function deriveSeed(seed: number, key: string): number {
  let hash = (FNV_OFFSET ^ (seed >>> 0)) >>> 0
  for (const char of key) {
    hash = Math.imul(hash ^ char.charCodeAt(0), FNV_PRIME) >>> 0
  }
  return hash
}

export function range(rng: Rng, min: number, max: number): number {
  return min + rng.next() * (max - min)
}

/** Bilangan bulat dalam [min, max] (inklusif). */
export function int(rng: Rng, min: number, max: number): number {
  return Math.floor(range(rng, min, max + 1))
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('pick: daftar kosong')
  }
  return items[Math.floor(rng.next() * items.length)]
}

export function chance(rng: Rng, probability: number): boolean {
  return rng.next() < probability
}

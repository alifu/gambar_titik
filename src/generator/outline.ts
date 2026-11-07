import type { Raster } from './raster.ts'
import { labelRegions, neighbors } from './regions.ts'

/** Region yang bisa diwarnai minimal sebesar ini (pixel). */
export const MIN_REGION_SIZE = 4
const MAX_MERGE_PASSES = 8

interface Donor {
  readonly color: string
  readonly depth: number
}

/** Cari warna tetangga yang paling banyak bersinggungan dengan region kecil. */
function findDonor(
  raster: Raster,
  members: readonly number[],
  label: number,
  labels: readonly number[],
): Donor | null {
  const counts = new Map<string, { count: number; depth: number }>()
  for (const index of members) {
    for (const next of neighbors(index, raster.width, raster.height)) {
      if (labels[next] === label || raster.ink[next]) continue
      const color = raster.colors[next]
      const entry = counts.get(color)
      counts.set(color, { count: (entry?.count ?? 0) + 1, depth: raster.depth[next] })
    }
  }
  const ranked = [...counts.entries()].sort(([colorA, a], [colorB, b]) =>
    b.count !== a.count ? b.count - a.count : colorA.localeCompare(colorB),
  )
  return ranked.length === 0 ? null : { color: ranked[0][0], depth: ranked[0][1].depth }
}

function groupMembers(labels: readonly number[], regionCount: number): number[][] {
  const groups = Array.from({ length: regionCount }, (): number[] => [])
  labels.forEach((label, index) => {
    if (label >= 0) groups[label].push(index)
  })
  return groups
}

/** Satu putaran penggabungan: region warna < minSize mengambil warna tetangganya. */
function mergePass(raster: Raster, minSize: number): Raster | null {
  const { labels, sizes } = labelRegions(
    raster.width,
    raster.height,
    (index) => !raster.ink[index],
    (a, b) => raster.colors[a] === raster.colors[b],
  )
  const colors = [...raster.colors]
  const depth = [...raster.depth]
  let changed = false
  groupMembers(labels, sizes.length).forEach((members, label) => {
    if (members.length >= minSize) return
    const donor = findDonor(raster, members, label, labels)
    if (donor === null) return
    members.forEach((index) => {
      colors[index] = donor.color
      depth[index] = donor.depth
    })
    changed = true
  })
  return changed ? { ...raster, colors, depth } : null
}

/** Gabungkan region warna yang terlalu kecil ke tetangganya sampai stabil. */
export function mergeSmallRegions(raster: Raster, minSize = MIN_REGION_SIZE): Raster {
  let current = raster
  for (let pass = 0; pass < MAX_MERGE_PASSES; pass++) {
    const next = mergePass(current, minSize)
    if (next === null) return current
    current = next
  }
  return current
}

/**
 * Garis tepi 1 pixel: untuk setiap pasangan pixel bertetangga yang berbeda warna,
 * pixel milik lapisan paling depan menjadi garis tepi. Pixel tinta selalu garis tepi.
 */
export function traceOutline(raster: Raster): boolean[] {
  const { width, height, colors, depth, ink } = raster
  const outline = [...ink]
  const mark = (a: number, b: number) => {
    if (ink[a] || ink[b] || colors[a] === colors[b]) return
    outline[depth[a] > depth[b] ? a : b] = true
  }
  for (let index = 0; index < colors.length; index++) {
    if (index % width < width - 1) mark(index, index + 1)
    if (Math.floor(index / width) < height - 1) mark(index, index + width)
  }
  return outline
}

/** Region kosong (non-garis) yang terlalu kecil dijadikan bagian garis tepi. */
export function absorbTinyRegions(
  outline: readonly boolean[],
  width: number,
  height: number,
  minSize = MIN_REGION_SIZE,
): boolean[] {
  const { labels, sizes } = labelRegions(
    width,
    height,
    (index) => !outline[index],
    () => true,
  )
  return outline.map((isOutline, index) => isOutline || sizes[labels[index]] < minSize)
}

export interface OutlinedRaster {
  readonly raster: Raster
  readonly outline: readonly boolean[]
}

export function buildOutline(raster: Raster): OutlinedRaster {
  const merged = mergeSmallRegions(raster)
  const traced = traceOutline(merged)
  return { raster: merged, outline: absorbTinyRegions(traced, merged.width, merged.height) }
}

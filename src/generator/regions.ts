export interface RegionMap {
  /** Label region per pixel; -1 untuk pixel yang tidak diikutkan. */
  readonly labels: readonly number[]
  readonly sizes: readonly number[]
}

/** Indeks tetangga 4-arah dari sebuah pixel. */
export function neighbors(index: number, width: number, height: number): number[] {
  const x = index % width
  const y = Math.floor(index / width)
  const result: number[] = []
  if (x > 0) result.push(index - 1)
  if (x < width - 1) result.push(index + 1)
  if (y > 0) result.push(index - width)
  if (y < height - 1) result.push(index + width)
  return result
}

/**
 * Beri label komponen terhubung 4-arah. `include` memilih pixel yang dihitung,
 * `connects` menentukan apakah dua pixel bertetangga berada di region yang sama.
 */
export function labelRegions(
  width: number,
  height: number,
  include: (index: number) => boolean,
  connects: (a: number, b: number) => boolean,
): RegionMap {
  const labels = new Array<number>(width * height).fill(-1)
  const sizes: number[] = []
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] !== -1 || !include(start)) continue
    const label = sizes.length
    const stack = [start]
    labels[start] = label
    let size = 0
    while (stack.length > 0) {
      const current = stack.pop() as number
      size++
      for (const next of neighbors(current, width, height)) {
        if (labels[next] !== -1 || !include(next) || !connects(current, next)) continue
        labels[next] = label
        stack.push(next)
      }
    }
    sizes.push(size)
  }
  return { labels, sizes }
}

import type { Progress } from '../types/progress'

/** Untuk tiap artId, ambil progres dengan updatedAt terbaru dari semua mode. */
export function latestProgressByArt(list: readonly Progress[]): Map<string, Progress> {
  const latest = new Map<string, Progress>()
  for (const item of list) {
    const current = latest.get(item.artId)
    if (!current || item.updatedAt > current.updatedAt) latest.set(item.artId, item)
  }
  return latest
}

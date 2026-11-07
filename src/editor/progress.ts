import { computePercent } from '../render/pixelColors'
import type { Artwork } from '../types/artwork'
import type { Progress } from '../types/progress'
import { isStoredHex } from './color'
import { emptyColors, type PixelColors } from './tools'

export interface EditorSnapshot {
  readonly colors: PixelColors
  readonly completed: boolean
  readonly recentColors: readonly string[]
}

/** Snapshot awal dari progres tersimpan; data yang ukurannya tidak cocok diganti kanvas kosong. */
export function snapshotFromProgress(
  artwork: Artwork,
  progress: Progress | undefined,
): EditorSnapshot {
  const size = artwork.width * artwork.height
  const colors = progress?.colors.length === size ? progress.colors : emptyColors(artwork)
  return {
    colors,
    completed: progress?.completed ?? false,
    recentColors: (progress?.recentColors ?? []).filter(isStoredHex),
  }
}

export function buildProgress(artwork: Artwork, snapshot: EditorSnapshot, now: number): Progress {
  return {
    artId: artwork.id,
    colors: snapshot.colors,
    percent: computePercent(artwork, snapshot.colors),
    completed: snapshot.completed,
    recentColors: snapshot.recentColors,
    updatedAt: now,
  }
}

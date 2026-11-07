/** Riwayat undo/redo yang immutable. */
export interface History<T> {
  readonly past: readonly T[]
  readonly present: T
  readonly future: readonly T[]
}

export const HISTORY_LIMIT = 100

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] }
}

/** Tambah langkah baru. `next` yang identik (===) dengan present diabaikan. Redo dihapus. */
export function commit<T>(history: History<T>, next: T, limit = HISTORY_LIMIT): History<T> {
  if (next === history.present) return history
  const past = [...history.past, history.present].slice(-limit)
  return { past, present: next, future: [] }
}

/** Ganti present tanpa menambah langkah (dipakai selama satu goresan drag). Redo dihapus. */
export function replacePresent<T>(history: History<T>, next: T): History<T> {
  if (next === history.present) return history
  return { ...history, present: next, future: [] }
}

export function undo<T>(history: History<T>): History<T> {
  if (history.past.length === 0) return history
  return {
    past: history.past.slice(0, -1),
    present: history.past[history.past.length - 1],
    future: [history.present, ...history.future],
  }
}

export function redo<T>(history: History<T>): History<T> {
  if (history.future.length === 0) return history
  return {
    past: [...history.past, history.present],
    present: history.future[0],
    future: history.future.slice(1),
  }
}

export const canUndo = <T>(history: History<T>): boolean => history.past.length > 0
export const canRedo = <T>(history: History<T>): boolean => history.future.length > 0

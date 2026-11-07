import { describe, expect, it } from 'vitest'
import {
  HISTORY_LIMIT,
  canRedo,
  canUndo,
  commit,
  createHistory,
  redo,
  replacePresent,
  undo,
} from './history'

describe('history', () => {
  it('undo lalu redo mengembalikan state', () => {
    const h = commit(commit(createHistory('a'), 'b'), 'c')
    const undone = undo(undo(h))
    expect(undone.present).toBe('a')
    expect(canUndo(undone)).toBe(false)
    expect(canRedo(undone)).toBe(true)
    expect(redo(redo(undone)).present).toBe('c')
  })

  it('undo/redo tanpa langkah = tidak berubah', () => {
    const h = createHistory('a')
    expect(undo(h)).toBe(h)
    expect(redo(h)).toBe(h)
  })

  it('aksi baru menghapus redo', () => {
    const h = undo(commit(createHistory('a'), 'b'))
    const next = commit(h, 'x')
    expect(next.future).toEqual([])
    expect(canRedo(next)).toBe(false)
    expect(next.past).toEqual(['a'])
  })

  it('commit nilai yang sama diabaikan', () => {
    const h = createHistory('a')
    expect(commit(h, 'a')).toBe(h)
    expect(replacePresent(h, 'a')).toBe(h)
  })

  it('dibatasi 100 langkah', () => {
    let h = createHistory(0)
    for (let i = 1; i <= HISTORY_LIMIT + 20; i++) h = commit(h, i)
    expect(h.past).toHaveLength(HISTORY_LIMIT)
    expect(h.past[0]).toBe(20)
    let undone = h
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) undone = undo(undone)
    expect(undone.present).toBe(20)
  })

  it('replacePresent tidak menambah langkah dan tidak memutasi', () => {
    const h = commit(createHistory('a'), 'b')
    const replaced = replacePresent(h, 'c')
    expect(replaced.past).toEqual(['a'])
    expect(replaced.present).toBe('c')
    expect(h.present).toBe('b')
  })
})

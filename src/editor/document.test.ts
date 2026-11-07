import { describe, expect, it } from 'vitest'
import { TEST_ARTWORK as art } from '../test/editorArtwork'
import { computePercent } from '../render/pixelColors'
import { createDocument, documentReducer, type DocumentAction } from './document'
import { buildProgress, snapshotFromProgress } from './progress'
import { emptyColors, paintPixels } from './tools'

const paint =
  (i: number, color = '#ff0000') =>
  (c: readonly (string | null)[]) =>
    paintPixels(art, c, [i], color)
const run = (actions: DocumentAction[]) =>
  actions.reduce(documentReducer, createDocument(emptyColors(art)))

describe('documentReducer', () => {
  it('satu goresan drag = satu langkah undo', () => {
    const state = run([
      { type: 'stroke-start' },
      { type: 'stroke-apply', update: paint(0) },
      { type: 'stroke-apply', update: paint(1) },
      { type: 'stroke-apply', update: paint(6) },
      { type: 'stroke-end' },
    ])
    expect(state.history.past).toHaveLength(1)
    expect(state.history.present.filter(Boolean)).toHaveLength(3)
    expect(documentReducer(state, { type: 'undo' }).history.present.every((c) => c === null)).toBe(
      true,
    )
  })

  it('goresan tanpa perubahan tidak menambah langkah', () => {
    const state = run([
      { type: 'stroke-start' },
      { type: 'stroke-apply', update: paint(2) },
      { type: 'stroke-end' },
    ])
    expect(state.history.past).toHaveLength(0)
  })

  it('stroke-apply di luar goresan diabaikan', () => {
    const state = run([{ type: 'stroke-apply', update: paint(0) }])
    expect(state.history.present[0]).toBeNull()
  })

  it('apply = satu langkah; undo/redo diblokir saat goresan aktif', () => {
    const applied = run([
      { type: 'apply', update: paint(0) },
      { type: 'apply', update: paint(1) },
    ])
    expect(applied.history.past).toHaveLength(2)
    const stroking = documentReducer(applied, { type: 'stroke-start' })
    expect(documentReducer(stroking, { type: 'undo' })).toBe(stroking)
    expect(documentReducer(stroking, { type: 'redo' })).toBe(stroking)
    const undone = documentReducer(applied, { type: 'undo' })
    expect(undone.history.present[1]).toBeNull()
    expect(documentReducer(undone, { type: 'redo' }).history.present[1]).toBe('#ff0000')
  })
})

describe('progress', () => {
  it('snapshotFromProgress memakai data tersimpan atau kanvas kosong', () => {
    const empty = snapshotFromProgress(art, undefined)
    expect(empty.colors).toHaveLength(36)
    expect(empty.completed).toBe(false)
    expect(empty.recentColors).toEqual([])

    const colors = paintPixels(art, emptyColors(art), [0], '#ff0000')
    const saved = snapshotFromProgress(art, {
      artId: art.id,
      colors,
      percent: 5,
      completed: true,
      recentColors: ['#ff0000', 'rusak'],
      updatedAt: 1,
    })
    expect(saved.colors).toBe(colors)
    expect(saved.completed).toBe(true)
    expect(saved.recentColors).toEqual(['#ff0000'])

    const wrongSize = snapshotFromProgress(art, {
      artId: art.id,
      colors: ['#ff0000'],
      percent: 0,
      completed: false,
      recentColors: [],
      updatedAt: 1,
    })
    expect(wrongSize.colors).toHaveLength(36)
  })

  it('buildProgress menghitung persen dan waktu', () => {
    const colors = paintPixels(art, emptyColors(art), [0, 1], '#ff0000')
    const progress = buildProgress(art, { colors, completed: false, recentColors: ['#ff0000'] }, 42)
    expect(progress).toEqual({
      artId: art.id,
      colors,
      percent: computePercent(art, colors),
      completed: false,
      recentColors: ['#ff0000'],
      updatedAt: 42,
    })
  })
})

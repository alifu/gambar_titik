import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Artwork } from '../../types/artwork'
import { clearAllForTests, getProgress, saveProgress } from '../../storage/repository'
import type { Progress } from '../../types/progress'
import { useAutoSave } from './useAutoSave'
import { useEditorData } from './useEditorData'

const art = {
  id: 'cat-01',
  width: 2,
  height: 2,
  title: 'Kucing',
  palette: [{ code: '0', name: 'Hitam', hex: '#000000' }],
  pixels: [0, -1, -1, -1],
} as unknown as Artwork
vi.mock('../../data/artworks', () => ({ getArtworkById: vi.fn(async () => art) }))

const colors = (n: number) => Array.from({ length: n }, () => null)
const stored = (artId: string, mode: Progress['mode'], size: number): Progress => ({
  artId,
  mode,
  colors: colors(size),
  percent: mode === 'number' ? 33 : 11,
  completed: false,
  recentColors: [],
  updatedAt: 1,
})

describe('editor storage per mode', () => {
  beforeEach(async () => {
    await clearAllForTests()
  })

  it('loads progress for the requested mode only', async () => {
    const size = art.width * art.height
    await saveProgress('budi', stored(art.id, 'free', size))
    await saveProgress('budi', stored(art.id, 'number', size))
    const { result } = renderHook(() => useEditorData(art.id, 'budi', 'number'))
    await waitFor(() => expect(result.current.state.status).toBe('ready'))
    const state = result.current.state
    expect(state.status === 'ready' && state.progress?.percent).toBe(33)
  })

  it('saves under the given mode', async () => {
    const snapshot = { colors: colors(art.width * art.height), completed: false, recentColors: [] }
    const { rerender } = renderHook(({ s }) => useAutoSave('budi', art, s, 'number'), {
      initialProps: { s: snapshot },
    })
    rerender({ s: { ...snapshot, completed: true } })
    await waitFor(async () => expect(await getProgress('budi', art.id, 'number')).toBeDefined(), {
      timeout: 2000,
    })
    expect(await getProgress('budi', art.id, 'free')).toBeUndefined()
  })
})

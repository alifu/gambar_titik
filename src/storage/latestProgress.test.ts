import { describe, expect, it } from 'vitest'
import type { Progress } from '../types/progress'
import { latestProgressByArt } from './latestProgress'

const item = (artId: string, mode: Progress['mode'], updatedAt: number): Progress => ({
  artId,
  mode,
  colors: [],
  percent: 0,
  completed: false,
  recentColors: [],
  updatedAt,
})

describe('latestProgressByArt', () => {
  it('picks the newest progress across modes per art', () => {
    const map = latestProgressByArt([
      item('a', 'free', 5),
      item('a', 'number', 9),
      item('b', 'free', 1),
    ])
    expect(map.get('a')?.mode).toBe('number')
    expect(map.get('b')?.updatedAt).toBe(1)
    expect(map.size).toBe(2)
  })

  it('returns an empty map for an empty list', () => {
    expect(latestProgressByArt([]).size).toBe(0)
  })
})

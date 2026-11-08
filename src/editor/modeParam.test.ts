import { describe, expect, it } from 'vitest'
import type { Progress } from '../types/progress'
import {
  DEFAULT_MODE,
  editorPath,
  latestOf,
  modeParamValue,
  parseModeParam,
  resolveMode,
} from './modeParam'

const progress = (mode: Progress['mode'], updatedAt: number): Progress => ({
  artId: 'a',
  mode,
  colors: [],
  percent: 0,
  completed: false,
  recentColors: [],
  updatedAt,
})

describe('mode dari URL', () => {
  it('memetakan nomor/bebas, nilai lain → null', () => {
    expect(parseModeParam('nomor')).toBe('number')
    expect(parseModeParam('bebas')).toBe('free')
    expect(parseModeParam('NOMOR')).toBeNull()
    expect(parseModeParam('')).toBeNull()
    expect(parseModeParam(null)).toBeNull()
    expect(modeParamValue('number')).toBe('nomor')
  })

  it('editorPath dengan dan tanpa mode', () => {
    expect(editorPath('cat-01')).toBe('/warnai/cat-01')
    expect(editorPath('cat-01', 'free')).toBe('/warnai/cat-01?mode=bebas')
    expect(editorPath('cat-01', 'number')).toBe('/warnai/cat-01?mode=nomor')
  })

  it('resolveMode: URL → mode terakhir → default nomor', () => {
    expect(resolveMode('free', progress('number', 5))).toBe('free')
    expect(resolveMode(null, progress('free', 5))).toBe('free')
    expect(resolveMode(null, undefined)).toBe(DEFAULT_MODE)
    expect(DEFAULT_MODE).toBe('number')
  })

  it('latestOf memilih updatedAt terbaru', () => {
    const older = progress('number', 1)
    const newer = progress('free', 2)
    expect(latestOf([older, newer])).toBe(newer)
    expect(latestOf([newer, older])).toBe(newer)
    expect(latestOf([undefined, older])).toBe(older)
    expect(latestOf([undefined, undefined])).toBeUndefined()
  })
})

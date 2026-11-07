import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Progress, UserProfile } from '../types/progress'
import {
  MAX_IMPORT_BYTES,
  applyImport,
  buildExportFile,
  downloadExportFile,
  exportFileName,
  mergeProgress,
  parseImportFile,
} from './exportImport'
import { clearAllForTests, listProgress, saveProgress } from './repository'

const user: UserProfile = { id: 'budi', displayName: 'Budi', createdAt: 1, lastLoginAt: 2 }
const prog = (
  artId: string,
  updatedAt = 10,
  colors: (string | null)[] = ['#ff0000', null],
): Progress => ({
  artId,
  colors,
  percent: 50,
  completed: false,
  recentColors: ['#ff0000'],
  updatedAt,
})
const counts = (id: string) => (id === 'a' || id === 'b' ? 2 : undefined)
const text = (value: unknown) => JSON.stringify(value)
const base = () => JSON.parse(text(buildExportFile(user, [prog('a')], 99)))

describe('export file', () => {
  it('names the file with user id and date', () => {
    expect(exportFileName('budi', new Date('2026-03-05T10:00:00Z'))).toBe(
      'gambar-titik-budi-2026-03-05.json',
    )
  })

  it('roundtrips export to import', () => {
    const file = buildExportFile(user, [prog('a'), prog('b')], 99)
    const result = parseImportFile(text(file), counts)
    expect(result).toEqual({ ok: true, file, warnings: [] })
  })

  it('downloads through a blob link', () => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    downloadExportFile(buildExportFile(user, []), new Date('2026-01-02T00:00:00Z'))
    expect(click).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x')
  })
})

describe('parseImportFile', () => {
  const fails = (input: string) => {
    const r = parseImportFile(input, counts)
    expect(r.ok).toBe(false)
    return r.ok ? [] : r.errors
  }

  it('rejects broken JSON and non-objects', () => {
    fails('{oops')
    fails('[]')
    fails('null')
  })

  it('rejects a wrong version', () => {
    fails(text({ ...base(), version: 2 }))
  })

  it('rejects invalid user, exportedAt and progress list', () => {
    fails(text({ ...base(), user: { id: 1 } }))
    fails(text({ ...base(), user: 'x' }))
    fails(text({ ...base(), progress: 'x' }))
    fails(text({ ...base(), exportedAt: 'x' }))
  })

  it('rejects malformed progress entries', () => {
    fails(text({ ...base(), progress: [5] }))
    fails(text({ ...base(), progress: [{ ...prog('a'), completed: 'yes' }] }))
    fails(text({ ...base(), progress: [{ ...prog('a'), recentColors: ['red'] }] }))
  })

  it('rejects invalid colors', () => {
    const errors = fails(text({ ...base(), progress: [prog('a', 1, ['red', null])] }))
    expect(errors[0]).toContain('a')
  })

  it('rejects length mismatch and non-array colors', () => {
    fails(text({ ...base(), progress: [prog('a', 1, ['#ffffff'])] }))
    fails(text({ ...base(), progress: [{ ...prog('a'), colors: 'x' }] }))
  })

  it('rejects out of range percent', () => {
    fails(text({ ...base(), progress: [{ ...prog('a'), percent: 101 }] }))
    fails(text({ ...base(), progress: [{ ...prog('a'), percent: -1 }] }))
  })

  it('skips unknown artIds with a warning', () => {
    const r = parseImportFile(text({ ...base(), progress: [prog('a'), prog('zzz')] }), counts)
    expect(r).toMatchObject({ ok: true })
    if (r.ok) {
      expect(r.file.progress).toHaveLength(1)
      expect(r.warnings[0]).toContain('zzz')
    }
  })

  it('rejects files over 10MB', () => {
    expect(fails('x'.repeat(MAX_IMPORT_BYTES + 1))).toHaveLength(1)
  })
})

describe('mergeProgress', () => {
  it('merge keeps the newest updatedAt per artId', () => {
    const result = mergeProgress(
      [prog('a', 5), prog('b', 20)],
      [prog('a', 10), prog('b', 1), prog('c', 3)],
      'merge',
    )
    const byId = Object.fromEntries(result.map((p) => [p.artId, p.updatedAt]))
    expect(byId).toEqual({ a: 10, b: 20, c: 3 })
  })

  it('replace uses incoming only', () => {
    const result = mergeProgress([prog('a')], [prog('c')], 'replace')
    expect(result.map((p) => p.artId)).toEqual(['c'])
  })
})

describe('applyImport', () => {
  beforeEach(async () => {
    await clearAllForTests()
    await saveProgress('budi', prog('a', 5))
    await saveProgress('budi', prog('b', 5))
  })

  it('replace deletes progress missing from the file', async () => {
    await applyImport('budi', [prog('a', 9)], 'replace')
    const items = await listProgress('budi')
    expect(items.map((p) => p.artId)).toEqual(['a'])
    expect(items[0]?.updatedAt).toBe(9)
  })

  it('merge keeps existing entries', async () => {
    await applyImport('budi', [prog('c', 9)], 'merge')
    expect((await listProgress('budi')).map((p) => p.artId).sort()).toEqual(['a', 'b', 'c'])
  })
})

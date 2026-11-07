import { describe, expect, it } from 'vitest'
import { ID } from '../i18n/id'
import { normalizeName } from './normalizeName'

describe('normalizeName', () => {
  it('creates a slug id from a valid name', () => {
    expect(normalizeName('Budi')).toEqual({ ok: true, id: 'budi', displayName: 'Budi' })
  })

  it('trims and collapses repeated spaces', () => {
    expect(normalizeName('  Budi   Santoso ')).toEqual({
      ok: true,
      id: 'budi-santoso',
      displayName: 'Budi Santoso',
    })
  })

  it('accepts accented letters, digits and allowed symbols', () => {
    const result = normalizeName('Éla_Ñu-1.x')
    expect(result).toMatchObject({ ok: true, id: 'éla_ñu-1.x' })
  })

  it('rejects empty, too short and too long names', () => {
    expect(normalizeName('   ')).toEqual({ ok: false, error: ID.nameError.empty })
    expect(normalizeName('a')).toEqual({ ok: false, error: ID.nameError.tooShort })
    expect(normalizeName('a'.repeat(31))).toEqual({ ok: false, error: ID.nameError.tooLong })
  })

  it('accepts boundary lengths', () => {
    expect(normalizeName('ab').ok).toBe(true)
    expect(normalizeName('a'.repeat(30)).ok).toBe(true)
  })

  it('rejects illegal characters', () => {
    expect(normalizeName('Budi<script>')).toEqual({ ok: false, error: ID.nameError.invalidChars })
    expect(normalizeName('Budi/../x')).toEqual({ ok: false, error: ID.nameError.invalidChars })
  })
})

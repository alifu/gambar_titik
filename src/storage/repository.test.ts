import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Progress, UserProfile } from '../types/progress'
import {
  StorageError,
  clearAllForTests,
  clearSession,
  deleteProgress,
  getProgress,
  getSession,
  getUser,
  listProgress,
  saveProgress,
  saveUser,
  setSession,
} from './repository'

const user: UserProfile = { id: 'budi', displayName: 'Budi', createdAt: 1, lastLoginAt: 2 }
const progress = (artId: string): Progress => ({
  artId,
  colors: ['#ff0000', null],
  percent: 50,
  completed: false,
  recentColors: [],
  updatedAt: 5,
})

describe('repository', () => {
  beforeEach(async () => {
    await clearAllForTests()
  })

  it('saves and reads a user', async () => {
    await saveUser(user)
    expect(await getUser('budi')).toEqual(user)
    expect(await getUser('nobody')).toBeUndefined()
  })

  it('saves, reads and deletes progress', async () => {
    await saveProgress('budi', progress('kucing'))
    expect(await getProgress('budi', 'kucing')).toEqual(progress('kucing'))
    await deleteProgress('budi', 'kucing')
    expect(await getProgress('budi', 'kucing')).toBeUndefined()
  })

  it('lists progress isolated per user', async () => {
    await saveProgress('budi', progress('a'))
    await saveProgress('budi', progress('b'))
    await saveProgress('budi-santoso', progress('c'))
    await saveUser(user)
    const items = await listProgress('budi')
    expect(items.map((p) => p.artId).sort()).toEqual(['a', 'b'])
  })

  it('manages the session', async () => {
    expect(await getSession()).toBeUndefined()
    await setSession('budi')
    expect(await getSession()).toBe('budi')
    await clearSession()
    expect(await getSession()).toBeUndefined()
  })

  it('wraps IndexedDB errors in StorageError', async () => {
    const spy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
      throw new Error('boom')
    })
    await expect(saveUser(user)).rejects.toBeInstanceOf(StorageError)
    spy.mockRestore()
  })
})

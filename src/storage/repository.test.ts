import { createStore, get, set } from 'idb-keyval'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Progress, UserProfile } from '../types/progress'
import {
  StorageError,
  clearAllForTests,
  clearSession,
  deleteProgress,
  purgeLegacyProgress,
  getProgress,
  getSession,
  getUser,
  listProgress,
  saveProgress,
  saveUser,
  setSession,
} from './repository'

const user: UserProfile = { id: 'budi', displayName: 'Budi', createdAt: 1, lastLoginAt: 2 }
const progress = (artId: string, mode: Progress['mode'] = 'free'): Progress => ({
  artId,
  mode,
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
    expect(await getProgress('budi', 'kucing', 'free')).toEqual(progress('kucing'))
    await deleteProgress('budi', 'kucing', 'free')
    expect(await getProgress('budi', 'kucing', 'free')).toBeUndefined()
  })

  it('lists progress isolated per user', async () => {
    await saveProgress('budi', progress('a'))
    await saveProgress('budi', progress('b'))
    await saveProgress('budi-santoso', progress('c'))
    await saveUser(user)
    const items = await listProgress('budi')
    expect(items.map((p) => p.artId).sort()).toEqual(['a', 'b'])
  })

  it('stores progress per mode under separate keys', async () => {
    await saveProgress('budi', progress('a', 'free'))
    await saveProgress('budi', { ...progress('a', 'number'), percent: 80 })
    expect((await getProgress('budi', 'a', 'number'))?.percent).toBe(80)
    expect((await getProgress('budi', 'a', 'free'))?.percent).toBe(50)
    expect(await listProgress('budi')).toHaveLength(2)
    await deleteProgress('budi', 'a', 'number')
    expect(await getProgress('budi', 'a', 'number')).toBeUndefined()
    expect(await getProgress('budi', 'a', 'free')).toBeDefined()
  })

  it('isolates modes between users', async () => {
    await saveProgress('budi', progress('a', 'number'))
    expect(await getProgress('budi-santoso', 'a', 'number')).toBeUndefined()
    expect(await listProgress('budi-santoso')).toEqual([])
  })

  it('ignores legacy keys when listing and purges them safely', async () => {
    const s = createStore('gambar-titik', 'kv')
    await set('progress:budi:kucing', { artId: 'kucing', colors: [] }, s)
    await set('progress:budi-santoso:kucing', { artId: 'kucing', colors: [] }, s)
    await saveProgress('budi', progress('a', 'free'))
    expect(await listProgress('budi')).toHaveLength(1)
    expect(await purgeLegacyProgress('budi')).toBe(1)
    expect(await purgeLegacyProgress('budi')).toBe(0)
    expect(await get('progress:budi:kucing', s)).toBeUndefined()
    expect(await get('progress:budi-santoso:kucing', s)).toBeDefined()
    expect(await listProgress('budi')).toHaveLength(1)
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

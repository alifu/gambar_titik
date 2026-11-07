import { clear, createStore, del, get, keys, set, type UseStore } from 'idb-keyval'
import { ID } from '../i18n/id'
import type { Progress, UserProfile } from '../types/progress'

const SESSION_KEY = 'session:current'

export class StorageError extends Error {
  constructor(action: string, options?: { cause?: unknown }) {
    super(ID.storage.failed(action), options)
    this.name = 'StorageError'
  }
}

let store: UseStore | undefined

function getStore(): UseStore {
  store ??= createStore('gambar-titik', 'kv')
  return store
}

async function guard<T>(action: string, run: (s: UseStore) => Promise<T>): Promise<T> {
  try {
    return await run(getStore())
  } catch (cause) {
    throw new StorageError(action, { cause })
  }
}

const userKey = (id: string) => `user:${id}`
const progressKey = (userId: string, artId: string) => `progress:${userId}:${artId}`
const progressPrefix = (userId: string) => `progress:${userId}:`

export const getUser = (id: string) =>
  guard('membaca pengguna', (s) => get<UserProfile>(userKey(id), s))

export const saveUser = (user: UserProfile) =>
  guard('menyimpan pengguna', (s) => set(userKey(user.id), user, s))

export const getProgress = (userId: string, artId: string) =>
  guard('membaca progres', (s) => get<Progress>(progressKey(userId, artId), s))

export const saveProgress = (userId: string, progress: Progress) =>
  guard('menyimpan progres', (s) => set(progressKey(userId, progress.artId), progress, s))

export const deleteProgress = (userId: string, artId: string) =>
  guard('menghapus progres', (s) => del(progressKey(userId, artId), s))

export const listProgress = (userId: string) =>
  guard('membaca daftar progres', async (s) => {
    const prefix = progressPrefix(userId)
    const matching = (await keys(s)).filter(
      (key): key is string => typeof key === 'string' && key.startsWith(prefix),
    )
    const items = await Promise.all(matching.map((key) => get<Progress>(key, s)))
    return items.filter((item): item is Progress => item !== undefined)
  })

export const getSession = () => guard('membaca sesi', (s) => get<string>(SESSION_KEY, s))

export const setSession = (userId: string) =>
  guard('menyimpan sesi', (s) => set(SESSION_KEY, userId, s))

export const clearSession = () => guard('menghapus sesi', (s) => del(SESSION_KEY, s))

/** Hanya untuk test: kosongkan seluruh store. */
export const clearAllForTests = () => guard('mengosongkan data', (s) => clear(s))

import { create } from 'zustand'
import { ID } from '../i18n/id'
import { requestPersistentStorage } from '../storage/persist'
import { clearSession, getSession, getUser, saveUser, setSession } from '../storage/repository'
import type { UserProfile } from '../types/progress'
import { normalizeName } from './normalizeName'

export type LoginResult =
  | { readonly ok: true; readonly isReturning: boolean; readonly user: UserProfile }
  | { readonly ok: false; readonly error: string }

interface SessionState {
  readonly currentUser: UserProfile | null
  /** false sampai restoreSession() selesai */
  readonly restored: boolean
  /** Pesan galat jika sesi tersimpan gagal dibaca; null jika tidak ada masalah. */
  readonly restoreError: string | null
  login: (name: string) => Promise<LoginResult>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
}

export const useSession = create<SessionState>()((set) => ({
  currentUser: null,
  restored: false,
  restoreError: null,

  async login(name) {
    const normalized = normalizeName(name)
    if (!normalized.ok) return normalized
    const now = Date.now()
    const existing = await getUser(normalized.id)
    const user: UserProfile = existing
      ? { ...existing, lastLoginAt: now }
      : {
          id: normalized.id,
          displayName: normalized.displayName,
          createdAt: now,
          lastLoginAt: now,
        }
    await saveUser(user)
    await setSession(user.id)
    void requestPersistentStorage()
    set({ currentUser: user, restored: true, restoreError: null })
    return { ok: true, isReturning: existing !== undefined, user }
  },

  async logout() {
    await clearSession()
    set({ currentUser: null })
  },

  async restoreSession() {
    try {
      const userId = await getSession()
      const user = userId ? await getUser(userId) : undefined
      set({ currentUser: user ?? null, restored: true, restoreError: null })
    } catch {
      set({ currentUser: null, restored: true, restoreError: ID.login.restoreFailed })
    }
  },
}))

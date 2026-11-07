import { beforeEach, describe, expect, it } from 'vitest'
import { clearAllForTests, getSession } from '../storage/repository'
import { useSession } from './useSession'

describe('useSession', () => {
  beforeEach(async () => {
    await clearAllForTests()
    useSession.setState({ currentUser: null, restored: false })
  })

  it('creates a new profile on first login', async () => {
    const result = await useSession.getState().login('Budi')
    expect(result).toMatchObject({ ok: true, isReturning: false })
    expect(useSession.getState().currentUser?.id).toBe('budi')
    expect(await getSession()).toBe('budi')
  })

  it('treats different capitalization and spacing as the same user', async () => {
    await useSession.getState().login('Budi Santoso')
    const first = useSession.getState().currentUser
    const result = await useSession.getState().login('  budi   SANTOSO ')
    expect(result).toMatchObject({ ok: true, isReturning: true })
    const second = useSession.getState().currentUser
    expect(second?.id).toBe(first?.id)
    expect(second?.displayName).toBe('Budi Santoso')
    expect(second?.createdAt).toBe(first?.createdAt)
    expect(second).not.toBe(first)
  })

  it('returns the validation error for invalid names', async () => {
    const result = await useSession.getState().login('x')
    expect(result.ok).toBe(false)
    expect(useSession.getState().currentUser).toBeNull()
  })

  it('logs out and clears the session', async () => {
    await useSession.getState().login('Budi')
    await useSession.getState().logout()
    expect(useSession.getState().currentUser).toBeNull()
    expect(await getSession()).toBeUndefined()
  })

  it('restores the last session', async () => {
    await useSession.getState().login('Budi')
    useSession.setState({ currentUser: null, restored: false })
    await useSession.getState().restoreSession()
    expect(useSession.getState().currentUser?.id).toBe('budi')
    expect(useSession.getState().restored).toBe(true)
  })

  it('restores to logged out when there is no session', async () => {
    await useSession.getState().restoreSession()
    expect(useSession.getState().currentUser).toBeNull()
    expect(useSession.getState().restored).toBe(true)
  })
})

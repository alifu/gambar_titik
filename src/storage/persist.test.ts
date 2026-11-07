import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestPersistentStorage, resetPersistRequestForTests } from './persist'

describe('requestPersistentStorage', () => {
  beforeEach(() => {
    resetPersistRequestForTests()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('calls persist only once', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    vi.stubGlobal('navigator', { storage: { persist } })
    expect(await requestPersistentStorage()).toBe(true)
    expect(await requestPersistentStorage()).toBe(false)
    expect(persist).toHaveBeenCalledTimes(1)
  })

  it('is safe when the API is unavailable', async () => {
    vi.stubGlobal('navigator', {})
    expect(await requestPersistentStorage()).toBe(false)
  })

  it('returns false when persist throws', async () => {
    vi.stubGlobal('navigator', { storage: { persist: () => Promise.reject(new Error('x')) } })
    expect(await requestPersistentStorage()).toBe(false)
  })
})

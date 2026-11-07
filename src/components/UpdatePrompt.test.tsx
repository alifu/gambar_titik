import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ID } from '../i18n/id'
import { UpdatePrompt } from './UpdatePrompt'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(),
}))

const mockRegisterSW = (needRefresh: boolean, updateServiceWorker = vi.fn()) => {
  vi.mocked(useRegisterSW).mockReturnValue({
    needRefresh: [needRefresh, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker,
  } as unknown as ReturnType<typeof useRegisterSW>)
  return updateServiceWorker
}

describe('UpdatePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when no new version is waiting', () => {
    mockRegisterSW(false)
    const { container } = render(<UpdatePrompt />)

    expect(container).toBeEmptyDOMElement()
  })

  it('asks to update and reloads with the new service worker', async () => {
    const updateServiceWorker = mockRegisterSW(true)
    render(<UpdatePrompt />)

    expect(screen.getByText(ID.update.message)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: ID.update.button }))

    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })
})

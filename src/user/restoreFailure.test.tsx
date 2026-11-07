import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from '../features/login/LoginPage'
import { ID } from '../i18n/id'
import { StorageError, getSession } from '../storage/repository'
import { useSession } from './useSession'

vi.mock('../storage/repository', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../storage/repository')>()),
  getSession: vi.fn(),
}))

describe('restoreSession failure', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockRejectedValue(new StorageError('membaca sesi'))
    useSession.setState({ currentUser: null, restored: false, restoreError: null })
  })

  it('stores a readable error instead of swallowing it', async () => {
    await useSession.getState().restoreSession()

    expect(useSession.getState()).toMatchObject({
      currentUser: null,
      restored: true,
      restoreError: ID.login.restoreFailed,
    })
  })

  it('shows the error on the login page while keeping the form usable', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(ID.login.restoreFailed)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: ID.login.submit })).toBeEnabled()
  })
})

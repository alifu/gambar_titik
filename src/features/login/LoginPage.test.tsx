import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ID } from '../../i18n/id'
import { clearAllForTests } from '../../storage/repository'
import { useSession } from '../../user/useSession'
import { LoginPage } from './LoginPage'

function setup() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/galeri" element={<h1>Halaman galeri</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(async () => {
    await clearAllForTests()
    useSession.setState({ currentUser: null, restored: false })
  })

  it('explains that progress is stored on this device', async () => {
    setup()
    expect(await screen.findByText(ID.login.storageNote)).toBeInTheDocument()
  })

  it('shows a validation error under the input', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText(ID.login.nameLabel), 'a')
    await user.click(screen.getByRole('button', { name: ID.login.submit }))
    expect(await screen.findByText(ID.nameError.tooShort)).toBeInTheDocument()
  })

  it('welcomes a new user then navigates to the gallery', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText(ID.login.nameLabel), 'Budi')
    await user.click(screen.getByRole('button', { name: ID.login.submit }))
    expect(await screen.findByText(ID.login.welcomeNew('Budi'))).toBeInTheDocument()
    expect(await screen.findByText('Halaman galeri')).toBeInTheDocument()
  })

  it('welcomes a returning user', async () => {
    const user = userEvent.setup()
    await useSession.getState().login('Budi')
    await useSession.getState().logout()
    setup()
    await user.type(screen.getByLabelText(ID.login.nameLabel), 'budi')
    await user.click(screen.getByRole('button', { name: ID.login.submit }))
    expect(await screen.findByText(ID.login.welcomeBack('Budi'))).toBeInTheDocument()
  })

  it('redirects straight to the gallery when a session exists', async () => {
    await useSession.getState().login('Budi')
    useSession.setState({ currentUser: null, restored: false })
    setup()
    expect(await screen.findByText('Halaman galeri')).toBeInTheDocument()
  })
})

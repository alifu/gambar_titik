import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadArtworks } from './data/artworks'
import { TEST_ARTWORKS } from './test/galleryFixtures'
import { App } from './App'
import { ID } from './i18n/id'
import { clearAllForTests } from './storage/repository'
import { useSession } from './user/useSession'

vi.mock('./data/artworks', () => ({ loadArtworks: vi.fn() }))

describe('App routing', () => {
  beforeEach(async () => {
    vi.mocked(loadArtworks).mockResolvedValue(TEST_ARTWORKS)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    await clearAllForTests()
    useSession.setState({ currentUser: null, restored: false })
    window.history.pushState({}, '', '/')
  })

  it('redirects the root path to the login page', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: ID.login.title })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('renders the login page title', () => {
    window.history.pushState({}, '', '/login')
    render(<App />)

    expect(screen.getByRole('heading', { name: ID.login.title })).toBeInTheDocument()
    expect(screen.getByText(ID.appName)).toBeInTheDocument()
  })

  it.each([
    ['/galeri', ID.gallery.title],
    ['/warnai/contoh', ID.editor.title],
    ['/profil', ID.profile.title],
  ])('renders %s for a logged in user', async (path, title) => {
    await useSession.getState().login('Budi')
    window.history.pushState({}, '', path)
    render(<App />)

    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
  })

  it.each(['/galeri', '/warnai/contoh', '/profil'])(
    'redirects %s to login when logged out',
    async (path) => {
      await useSession.getState().logout()
      window.history.pushState({}, '', path)
      render(<App />)

      expect(await screen.findByRole('heading', { name: ID.login.title })).toBeInTheDocument()
      expect(window.location.pathname).toBe('/login')
    },
  )

  it('enables profile restore once image data has loaded', async () => {
    await useSession.getState().login('Budi')
    window.history.pushState({}, '', '/profil')
    render(<App />)

    expect(await screen.findByLabelText(ID.profile.restore)).toBeEnabled()
  })
})

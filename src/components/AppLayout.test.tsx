import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { rememberGalleryQuery } from '../features/gallery/galleryPath'
import { ID } from '../i18n/id'
import { clearAllForTests } from '../storage/repository'
import { useSession } from '../user/useSession'
import { AppLayout } from './AppLayout'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], updateServiceWorker: vi.fn() }),
}))

function setup(path = '/galeri') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/galeri" element={<h1>Halaman galeri</h1>} />
          <Route path="/profil" element={<h1>Halaman profil</h1>} />
          <Route path="/login" element={<h1>Halaman masuk</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppLayout', () => {
  beforeEach(async () => {
    await clearAllForTests()
    sessionStorage.clear()
    useSession.setState({ currentUser: null, restored: false })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('hides navigation when logged out but keeps the skip link', () => {
    setup('/login')

    expect(screen.queryByRole('link', { name: ID.nav.gallery })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: ID.a11y.skipToContent })).toHaveAttribute(
      'href',
      '#konten-utama',
    )
  })

  it('marks the current page and keeps the last gallery filter', async () => {
    await useSession.getState().login('Budi')
    rememberGalleryQuery('?kategori=hewan')
    setup('/profil')

    expect(screen.getByRole('link', { name: ID.nav.profile })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: ID.nav.gallery })).toHaveAttribute(
      'href',
      '/galeri?kategori=hewan',
    )
  })

  it('logs out and returns to the login page', async () => {
    await useSession.getState().login('Budi')
    setup()
    await userEvent.click(screen.getByRole('button', { name: ID.nav.logout }))

    expect(await screen.findByText('Halaman masuk')).toBeInTheDocument()
    expect(useSession.getState().currentUser).toBeNull()
  })

  it('announces offline status and clears it when back online', () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false })
    setup('/login')
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByText(ID.offline.message)).toBeInTheDocument()

    vi.stubGlobal('navigator', { ...navigator, onLine: true })
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByText(ID.offline.message)).not.toBeInTheDocument()
  })

  it('offers installation and hides the banner after dismissal or install', async () => {
    const prompt = vi.fn().mockResolvedValue(undefined)
    setup('/login')
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    })
    act(() => {
      window.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(true)

    await userEvent.click(screen.getByRole('button', { name: ID.install.button }))
    expect(prompt).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('region', { name: ID.install.region })).not.toBeInTheDocument()
  })

  it('can dismiss the install banner, and hides it when already standalone', async () => {
    setup('/login')
    const fire = () =>
      act(() => {
        window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), { prompt: vi.fn() }))
      })
    fire()
    await userEvent.click(screen.getByRole('button', { name: ID.install.dismiss }))
    expect(screen.queryByRole('region', { name: ID.install.region })).not.toBeInTheDocument()

    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    fire()
    expect(screen.queryByRole('region', { name: ID.install.region })).not.toBeInTheDocument()
  })
})

import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { galleryPathWithQuery } from '../features/gallery/galleryPath'
import { ID } from '../i18n/id'
import { useSession } from '../user/useSession'
import { InstallPrompt } from './InstallPrompt'
import { OfflineBanner } from './OfflineBanner'
import { UpdatePrompt } from './UpdatePrompt'

const MAIN_ID = 'konten-utama'

function UserNav() {
  const navigate = useNavigate()
  const logout = useSession((s) => s.logout)
  // Dibaca ulang tiap render; AppLayout dirender ulang setiap lokasi berubah.
  useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="app-nav" aria-label={ID.a11y.mainNav}>
      <NavLink to={galleryPathWithQuery()} className="app-nav-link">
        {ID.nav.gallery}
      </NavLink>
      <NavLink to="/profil" className="app-nav-link">
        {ID.nav.profile}
      </NavLink>
      <button type="button" className="app-nav-logout" onClick={() => void handleLogout()}>
        {ID.nav.logout}
      </button>
    </nav>
  )
}

export function AppLayout() {
  const currentUser = useSession((s) => s.currentUser)
  return (
    <div className="app-layout">
      <a className="skip-link" href={`#${MAIN_ID}`}>
        {ID.a11y.skipToContent}
      </a>
      <header className="app-header">
        <p className="app-title">{ID.appName}</p>
        {currentUser && <UserNav />}
      </header>
      <OfflineBanner />
      <main id={MAIN_ID} className="app-main" tabIndex={-1}>
        <Outlet />
      </main>
      <InstallPrompt />
      <UpdatePrompt />
    </div>
  )
}

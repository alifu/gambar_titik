import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { usePixelCountLookup } from './data/useArtworks'
import { AppLayout } from './components/AppLayout'
import { EditorPage } from './features/editor/EditorPage'
import { GalleryPage } from './features/gallery/GalleryPage'
import { LoginPage } from './features/login/LoginPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { RequireUser } from './user/RequireUser'

function ProfileRoute() {
  const { lookup, error } = usePixelCountLookup()
  return <ProfilePage getPixelCount={lookup} lookupError={error} />
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireUser />}>
            <Route path="/galeri" element={<GalleryPage />} />
            <Route path="/warnai/:artId" element={<EditorPage />} />
            <Route path="/profil" element={<ProfileRoute />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

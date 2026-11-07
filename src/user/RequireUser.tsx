import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from './useSession'

export function RequireUser() {
  const currentUser = useSession((s) => s.currentUser)
  const restored = useSession((s) => s.restored)
  const restoreSession = useSession((s) => s.restoreSession)

  useEffect(() => {
    if (!restored) void restoreSession()
  }, [restored, restoreSession])

  if (!restored) return null
  if (!currentUser) return <Navigate to="/login" replace />
  return <Outlet />
}

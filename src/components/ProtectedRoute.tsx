import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PageLoader } from '@/components/ui/Spinner'

/**
 * Protege rutas por sesión y, opcionalmente, por rol.
 *  - Sin sesión → /login (recordando a dónde quería ir).
 *  - requireAdmin y no es admin → catálogo del cliente.
 */
export function ProtectedRoute({ requireAdmin = false }: { requireAdmin?: boolean }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

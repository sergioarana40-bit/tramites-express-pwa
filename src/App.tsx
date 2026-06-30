import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { InstallBanner } from '@/components/InstallBanner'
import AppLayout from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import Registro from '@/pages/Registro'
import Catalogo from '@/pages/Catalogo'
import TramiteDetalle from '@/pages/TramiteDetalle'
import MisSolicitudes from '@/pages/MisSolicitudes'
import MiPerfil from '@/pages/MiPerfil'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminSolicitudes from '@/pages/admin/AdminSolicitudes'
import AdminSolicitudDetalle from '@/pages/admin/AdminSolicitudDetalle'
import AdminCatalogo from '@/pages/admin/AdminCatalogo'
import AdminUsuarios from '@/pages/admin/AdminUsuarios'

/** En "/", los admin van a su panel; los clientes ven el catálogo. */
function RoleHome() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Navigate to="/admin" replace /> : <Catalogo />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Rutas de cliente (requieren sesión) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<RoleHome />} />
              <Route path="tramite/:id" element={<TramiteDetalle />} />
              <Route path="mis-solicitudes" element={<MisSolicitudes />} />
              <Route path="mi-perfil" element={<MiPerfil />} />
            </Route>
          </Route>

          {/* Rutas de administración (requieren rol admin) */}
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route element={<AppLayout />}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/solicitudes" element={<AdminSolicitudes />} />
              <Route path="admin/solicitudes/:id" element={<AdminSolicitudDetalle />} />
              <Route path="admin/catalogo" element={<AdminCatalogo />} />
              <Route path="admin/usuarios" element={<AdminUsuarios />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <InstallBanner />
      </BrowserRouter>
    </AuthProvider>
  )
}

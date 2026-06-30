import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { InstallPWA } from '@/components/InstallPWA'
import { NotificacionesBell } from '@/components/NotificacionesBell'

interface NavItem {
  to: string
  label: string
  end?: boolean
  icon: ReactNode
}

const I = {
  grid: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  doc: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  ),
  user: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
  chart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" /><rect x="7" y="10" width="3" height="7" /><rect x="12" y="6" width="3" height="11" />
      <rect x="17" y="13" width="3" height="4" />
    </svg>
  ),
  list: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
    </svg>
  ),
  users: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.5" /><path d="M3 21c0-3.3 2.7-5 6-5s6 1.7 6 5" /><path d="M16 5.5a3.5 3.5 0 0 1 0 6.5M21 21c0-3-1.6-4.6-4-5" />
    </svg>
  ),
}

const CLIENTE_NAV: NavItem[] = [
  { to: '/', label: 'Catálogo', end: true, icon: I.grid },
  { to: '/mis-solicitudes', label: 'Solicitudes', icon: I.doc },
  { to: '/mi-perfil', label: 'Perfil', icon: I.user },
]

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', end: true, icon: I.chart },
  { to: '/admin/solicitudes', label: 'Solicitudes', icon: I.doc },
  { to: '/admin/catalogo', label: 'Catálogo', icon: I.list },
  { to: '/admin/usuarios', label: 'Usuarios', icon: I.users },
]

export default function AppLayout() {
  const { profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const items = isAdmin ? ADMIN_NAV : CLIENTE_NAV

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const topLink = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-ink2 hover:bg-paper'
    }`

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <NavLink to={isAdmin ? '/admin' : '/'} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink">
              <svg viewBox="0 0 64 64" width="22" height="22">
                <path d="M20 14h16l10 10v26a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z" fill="#ffffff" />
                <path d="M36 14v8a2 2 0 0 0 2 2h8z" fill="#9FB4D8" />
                <path d="M23 44l5 5 11-13" fill="none" stroke="#b5852a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="leading-tight">
              <span className="block font-display text-base font-semibold text-ink">Trámites Express</span>
              <span className="block text-[11px] text-mut">
                {isAdmin ? 'Panel de administración' : 'Gestoría digital'}
              </span>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} className={topLink}>
                {it.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block">
              <InstallPWA compact />
            </div>
            <NotificacionesBell />
            {/* Pill de rol / tipo de precio */}
            <span className="hidden items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-[11px] font-bold capitalize text-accent-ink sm:inline-flex">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b5852a" strokeWidth="2.2">
                <path d="M20 12V8H6a2 2 0 0 1 0-4h12v4" /><path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
              </svg>
              {isAdmin ? 'Admin' : profile?.tipo_precio}
            </span>
            <button onClick={handleSignOut} className="btn-secondary !rounded-lg !px-2.5 !py-1.5" title="Cerrar sesión">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
                <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:pb-8">
        <Outlet />
      </main>

      {/* Bottom tab bar (móvil) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold transition-colors ${
                isActive ? 'text-brand-600' : 'text-mut'
              }`
            }
          >
            {it.icon}
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

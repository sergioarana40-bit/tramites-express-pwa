import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { getNotificaciones, marcarLeida, marcarTodasLeidas } from '@/lib/api'
import { formatFechaHora } from '@/lib/format'
import type { Notificacion } from '@/lib/types'

export function NotificacionesBell() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<Notificacion[]>([])
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<Notificacion | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!user) return
    let active = true

    getNotificaciones(user.id)
      .then((n) => active && setItems(n))
      .catch(() => {})

    // Suscripción en tiempo real a nuevas notificaciones del usuario.
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const nueva = payload.new as Notificacion
          setItems((prev) => [nueva, ...prev.filter((p) => p.id !== nueva.id)])
          setToast(nueva)
          clearTimeout(toastTimer.current)
          toastTimer.current = setTimeout(() => setToast(null), 6000)
        },
      )
      .subscribe()

    return () => {
      active = false
      clearTimeout(toastTimer.current)
      supabase.removeChannel(channel)
    }
  }, [user])

  const noLeidas = items.filter((n) => !n.leida).length

  const abrir = async (n: Notificacion) => {
    setOpen(false)
    if (!n.leida) {
      setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, leida: true } : p)))
      marcarLeida(n.id).catch(() => {})
    }
    navigate(isAdmin ? `/admin/solicitudes/${n.solicitud_id ?? ''}` : '/mis-solicitudes')
  }

  const todasLeidas = async () => {
    if (!user) return
    setItems((prev) => prev.map((p) => ({ ...p, leida: true })))
    marcarTodasLeidas(user.id).catch(() => {})
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg border border-line bg-white p-2 text-ink2 hover:bg-paper"
        aria-label="Notificaciones"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="text-sm font-semibold text-ink">Notificaciones</span>
              {noLeidas > 0 && (
                <button onClick={todasLeidas} className="text-xs font-medium text-brand-700 hover:underline">
                  Marcar todas
                </button>
              )}
            </div>
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {items.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-mut">Sin notificaciones aún.</li>
              )}
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => abrir(n)}
                    className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-paper ${n.leida ? '' : 'bg-brand-50/50'}`}
                  >
                    <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${n.leida ? 'bg-transparent' : 'bg-brand-600'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{n.titulo}</p>
                      <p className="text-xs text-ink2">{n.mensaje}</p>
                      <p className="mt-0.5 text-[10px] text-mut">{formatFechaHora(n.created_at)}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Toast efímero al recibir una nueva notificación */}
      {toast && (
        <div className="fixed right-4 top-20 z-[70] w-72 max-w-[calc(100vw-2rem)] animate-[slideUp_0.3s_ease-out] rounded-2xl border border-line bg-white p-3.5 shadow-lift">
          <div className="flex items-start gap-2.5">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{toast.titulo}</p>
              <p className="text-xs text-ink2">{toast.mensaje}</p>
            </div>
            <button onClick={() => setToast(null)} className="ml-auto text-mut hover:text-ink">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

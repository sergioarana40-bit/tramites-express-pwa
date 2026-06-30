import { useAuth } from '@/context/AuthContext'

/** Marcador temporal para rutas que se construyen en fases posteriores. */
export default function Placeholder({ titulo, fase }: { titulo: string; fase: string }) {
  const { profile } = useAuth()
  return (
    <div className="card p-8 text-center">
      <h1 className="text-xl font-bold text-slate-900">{titulo}</h1>
      <p className="mt-2 text-sm text-slate-500">Se construye en la {fase}.</p>
      <p className="mt-4 text-xs text-slate-400">
        Sesión activa: {profile?.full_name} · {profile?.role}
      </p>
    </div>
  )
}

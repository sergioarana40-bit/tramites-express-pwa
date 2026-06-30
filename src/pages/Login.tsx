import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { AuthShell } from '@/components/layout/AuthShell'

export default function Login() {
  const { session, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'
  if (session) return <Navigate to={from} replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? mapError(err.message) : 'No se pudo iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Bienvenido de vuelta" subtitle="Gestiona tus trámites en un solo lugar.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Correo electrónico</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="tucorreo@ejemplo.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Entrar'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-medium text-brand-700 hover:underline">
          Regístrate
        </Link>
      </p>

      <div className="mt-6 flex items-start gap-3 rounded-xl bg-accent-soft p-3.5 text-xs text-accent-ink">
        <svg className="mt-0.5 h-4 w-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="#b5852a" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <div className="leading-relaxed">
          <b className="text-[#5A430F]">Cuentas de prueba</b>
          <br />admin@tramitesexpress.mx · Admin123!
          <br />cliente@tramitesexpress.mx · Cliente123!
        </div>
      </div>
    </AuthShell>
  )
}

function mapError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos'
  if (/email not confirmed/i.test(msg)) return 'Debes confirmar tu correo antes de entrar'
  return msg
}

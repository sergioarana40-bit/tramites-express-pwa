import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { AuthShell } from '@/components/layout/AuthShell'

export default function Registro() {
  const { session, signUp } = useAuth()
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [curp, setCurp] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!nombre.trim() || !apellidos.trim()) {
      setError('Escribe tu nombre y apellidos')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      await signUp(email.trim(), password, {
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        curp: curp.trim(),
      })
      // Si el proyecto exige confirmación por correo no habrá sesión todavía;
      // si no, onAuthStateChange iniciará sesión y el router redirige solo.
    } catch (err) {
      setError(err instanceof Error ? mapError(err.message) : 'No se pudo crear la cuenta')
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Crea tu cuenta" subtitle="Regístrate para solicitar trámites en línea">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink2">Nombre(s)</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input-field"
              placeholder="Tu(s) nombre(s)"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink2">Apellidos</label>
            <input
              type="text"
              required
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              className="input-field"
              placeholder="Paterno y materno"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink2">
            CURP <span className="font-normal text-mut">(opcional)</span>
          </label>
          <input
            type="text"
            value={curp}
            onChange={(e) => setCurp(e.target.value.toUpperCase())}
            className="input-field uppercase"
            placeholder="18 caracteres"
            maxLength={18}
          />
        </div>

        {/* Aviso de para qué sirve esta info */}
        <div className="flex items-start gap-2.5 rounded-xl bg-brand-50 px-3 py-2.5 text-xs text-ink2">
          <svg className="mt-0.5 h-4 w-4 flex-none text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2 3 14h7l-1 8 10-12h-7z" strokeLinejoin="round" />
          </svg>
          <p>
            Con tus datos <b className="font-semibold text-ink">autocompletamos tus trámites</b> y los
            procesamos más rápido. Podrás editarlos cuando quieras desde <b className="font-semibold text-ink">Mi perfil</b>.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink2">Correo electrónico</label>
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
          <label className="mb-1 block text-sm font-medium text-ink2">Contraseña</label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-mut">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  )
}

function mapError(msg: string): string {
  if (/already registered|already exists/i.test(msg)) return 'Ese correo ya está registrado'
  if (/password/i.test(msg)) return 'La contraseña no cumple los requisitos'
  return msg
}

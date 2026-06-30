import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { guardarPerfil } from '@/lib/api'
import { CAMPOS_PERFIL, perfilCompletitud } from '@/lib/perfilCampos'
import { Spinner } from '@/components/ui/Spinner'

export default function MiPerfil() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [datos, setDatos] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    // Prefill correo con el email de la cuenta si aún no está capturado.
    const base = { ...(profile.datos_personales ?? {}) }
    if (!base.correo && user?.email) base.correo = user.email
    if (!base.nombre_completo && profile.full_name) base.nombre_completo = profile.full_name
    setDatos(base)
  }, [profile, user])

  const { llenos, total } = useMemo(() => perfilCompletitud(datos), [datos])
  const pct = Math.round((llenos / total) * 100)

  const set = (key: string, value: string) => setDatos((d) => ({ ...d, [key]: value }))

  const onSave = async () => {
    if (!user) return
    setSaving(true)
    setMsg(null)
    setError(null)
    try {
      // Limpia claves vacías para no guardar basura.
      const limpio = Object.fromEntries(
        Object.entries(datos).filter(([, v]) => v?.trim()),
      ) as Record<string, string>
      await guardarPerfil({
        id: user.id,
        fullName: fullName.trim() || limpio.nombre_completo || '',
        datosPersonales: limpio,
      })
      await refreshProfile()
      setMsg('Perfil guardado. Tus trámites se autollenarán con estos datos.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
        <p className="text-sm text-slate-500">
          Guarda tus datos una vez y se rellenarán automáticamente al solicitar un trámite.
        </p>
      </div>

      {/* Progreso de completitud */}
      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Perfil completo</span>
          <span className="text-slate-500">{llenos}/{total} datos</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nombre para mostrar</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" placeholder="Tu nombre" />
        </div>

        <hr className="border-slate-100" />
        <p className="text-sm font-semibold text-slate-700">Datos para tus trámites</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CAMPOS_PERFIL.map((c) => (
            <div key={c.key}>
              <label className="mb-1 block text-sm font-medium text-slate-700">{c.label}</label>
              <input
                type={c.type}
                value={datos[c.key] ?? ''}
                onChange={(e) => set(c.key, e.target.value)}
                placeholder={c.placeholder}
                className="input-field"
                autoComplete="off"
              />
            </div>
          ))}
        </div>

        {(msg || error) && (
          <p className={`rounded-lg px-3 py-2 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {error ?? msg}
          </p>
        )}

        <div className="flex justify-end">
          <button onClick={onSave} disabled={saving} className="btn-primary">
            {saving ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Guardar perfil'}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        🔒 Estos datos son privados (solo tú y el gestor que procesa tu trámite pueden verlos). No
        guardes aquí contraseñas de portales; esas se piden por trámite cuando aplica.
      </p>
    </div>
  )
}

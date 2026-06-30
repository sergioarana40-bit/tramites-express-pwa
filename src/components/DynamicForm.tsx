import { useState } from 'react'
import { esCampoSensible } from '@/lib/format'

/**
 * Formulario dinámico: genera un campo por cada dato requerido del trámite.
 * Los campos sensibles (contraseñas/credenciales) se marcan en la UI, se
 * capturan como password y NO se registran en consola.   // TODO: producción
 */
export function DynamicForm({
  campos,
  values,
  onChange,
  autollenados,
}: {
  campos: string[]
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  /** Campos cuyo valor vino del perfil del cliente (se marcan visualmente). */
  autollenados?: Set<string>
}) {
  const [visibles, setVisibles] = useState<Record<string, boolean>>({})

  const set = (campo: string, valor: string) => onChange({ ...values, [campo]: valor })
  const hayCamposSensibles = campos.some(esCampoSensible)

  return (
    <div className="space-y-4">
      {campos.map((campo) => {
        const sensible = esCampoSensible(campo)
        const visible = visibles[campo] ?? false
        return (
          <div key={campo}>
            <label className="mb-1 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
              <span className="capitalize">{campo}</span>
              {sensible && (
                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                  🔒 Sensible
                </span>
              )}
              {autollenados?.has(campo) && (
                <span className="inline-flex items-center gap-1 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                  ✓ de tu perfil
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={sensible && !visible ? 'password' : 'text'}
                value={values[campo] ?? ''}
                onChange={(e) => set(campo, e.target.value)}
                autoComplete={sensible ? 'off' : 'on'}
                className="input-field pr-10"
                placeholder={`Captura: ${campo}`}
              />
              {sensible && (
                <button
                  type="button"
                  onClick={() => setVisibles((v) => ({ ...v, [campo]: !visible }))}
                  className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label={visible ? 'Ocultar' : 'Mostrar'}
                >
                  {visible ? '🙈' : '👁️'}
                </button>
              )}
            </div>
          </div>
        )
      })}

      {hayCamposSensibles && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          ⚠️ Este trámite pide datos sensibles. Para la demo, usa datos de prueba: no ingreses
          contraseñas reales. La custodia de credenciales de terceros requiere cifrado y revisión
          de cumplimiento antes de un uso real.
        </p>
      )}
    </div>
  )
}

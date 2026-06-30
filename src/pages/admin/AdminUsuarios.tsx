import { useCallback, useEffect, useState } from 'react'
import { getUsuarios, actualizarTipoPrecio } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { formatFecha } from '@/lib/format'
import { CAMPOS_PERFIL, nombreCompleto, perfilCompletitud } from '@/lib/perfilCampos'
import { PageLoader } from '@/components/ui/Spinner'
import type { Profile, TipoPrecio } from '@/lib/types'

export default function AdminUsuarios() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Profile[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [abierto, setAbierto] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      setRows(await getUsuarios())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const cambiarTipo = async (id: string, tipo: TipoPrecio) => {
    setSavingId(id)
    setError(null)
    try {
      await actualizarTipoPrecio(id, tipo)
      setRows((prev) => prev?.map((p) => (p.id === id ? { ...p, tipo_precio: tipo } : p)) ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar')
    } finally {
      setSavingId(null)
    }
  }

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
  if (!rows) return <PageLoader label="Cargando usuarios…" />

  const clientes = rows.filter((r) => r.role === 'cliente')
  const admins = rows.filter((r) => r.role === 'admin')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Usuarios</h1>
        <p className="text-sm text-mut">
          {clientes.length} cliente(s) · {admins.length} administrador(es)
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((p) => {
          const datos = p.datos_personales ?? {}
          const nombre = nombreCompleto(datos) || p.full_name || '—'
          const { llenos, total } = perfilCompletitud(datos)
          const expandido = abierto === p.id
          const inicial = (nombre[0] ?? '?').toUpperCase()

          return (
            <div key={p.id} className="card overflow-hidden">
              <button
                onClick={() => setAbierto(expandido ? null : p.id)}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-paper/60"
              >
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {inicial}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{nombre}</p>
                    {p.id === user?.id && <span className="text-xs text-brand-600">(tú)</span>}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        p.role === 'admin' ? 'bg-brand-100 text-brand-800' : 'bg-paper text-ink2'
                      }`}
                    >
                      {p.role}
                    </span>
                  </div>
                  <p className="truncate text-xs text-mut">
                    {datos.correo ?? '—'}
                    {datos.curp ? ` · CURP: ${datos.curp}` : ''}
                    {datos.telefono ? ` · Tel: ${datos.telefono}` : ''}
                  </p>
                </div>
                {p.role === 'cliente' && (
                  <span
                    className={`hidden flex-none rounded-full px-2.5 py-1 text-[11px] font-bold capitalize sm:inline-block ${
                      p.tipo_precio === 'mayorista'
                        ? 'bg-accent-soft text-accent-ink'
                        : 'bg-paper text-ink2'
                    }`}
                  >
                    {p.tipo_precio}
                  </span>
                )}
                <svg
                  className={`h-4 w-4 flex-none text-mut transition-transform ${expandido ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {expandido && (
                <div className="border-t border-line bg-paper/40 p-4">
                  {/* Datos personales del usuario */}
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-mut">
                      Información del usuario
                    </p>
                    <span className="text-[11px] text-mut">Perfil {llenos}/{total} · alta {formatFecha(p.created_at)}</span>
                  </div>
                  <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {CAMPOS_PERFIL.map((c) => (
                      <div key={c.key} className="rounded-lg border border-line bg-white px-3 py-2">
                        <dt className="text-[11px] text-mut">{c.label}</dt>
                        <dd className={`text-sm ${datos[c.key] ? 'text-ink' : 'text-mut/60'}`}>
                          {datos[c.key] || 'Sin capturar'}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {/* Acciones del admin */}
                  {p.role === 'cliente' && (
                    <div className="mt-4 flex items-center gap-3">
                      <label className="text-sm font-medium text-ink2">Tipo de precio:</label>
                      <select
                        value={p.tipo_precio}
                        disabled={savingId === p.id}
                        onChange={(e) => cambiarTipo(p.id, e.target.value as TipoPrecio)}
                        className="input-field !w-auto !py-1.5 text-sm"
                      >
                        <option value="publico">Público</option>
                        <option value="mayorista">Mayorista</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

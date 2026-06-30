import { useCallback, useEffect, useState } from 'react'
import { getUsuarios, actualizarTipoPrecio } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { formatFecha } from '@/lib/format'
import { PageLoader } from '@/components/ui/Spinner'
import type { Profile, TipoPrecio } from '@/lib/types'

export default function AdminUsuarios() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Profile[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

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

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
  if (!rows) return <PageLoader label="Cargando usuarios…" />

  const clientes = rows.filter((r) => r.role === 'cliente')
  const admins = rows.filter((r) => r.role === 'admin')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <p className="text-sm text-slate-500">
          {clientes.length} cliente(s) · {admins.length} administrador(es)
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="hidden grid-cols-12 gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase text-slate-500 sm:grid">
          <span className="col-span-4">Nombre</span>
          <span className="col-span-2">Rol</span>
          <span className="col-span-3">Alta</span>
          <span className="col-span-3">Tipo de precio</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {rows.map((p) => (
            <li key={p.id} className="grid grid-cols-2 items-center gap-3 px-4 py-3 text-sm sm:grid-cols-12">
              <div className="col-span-2 sm:col-span-4">
                <p className="font-medium text-slate-800">
                  {p.full_name ?? '—'}
                  {p.id === user?.id && <span className="ml-2 text-xs text-brand-600">(tú)</span>}
                </p>
              </div>
              <span className="sm:col-span-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.role === 'admin' ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {p.role}
                </span>
              </span>
              <span className="text-xs text-slate-500 sm:col-span-3">{formatFecha(p.created_at)}</span>
              <div className="col-span-2 sm:col-span-3">
                {p.role === 'cliente' ? (
                  <select
                    value={p.tipo_precio}
                    disabled={savingId === p.id}
                    onChange={(e) => cambiarTipo(p.id, e.target.value as TipoPrecio)}
                    className="input-field !py-1 text-sm"
                  >
                    <option value="publico">Público</option>
                    <option value="mayorista">Mayorista</option>
                  </select>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

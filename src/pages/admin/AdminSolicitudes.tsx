import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTodasLasSolicitudes } from '@/lib/api'
import { formatMXN, formatFecha } from '@/lib/format'
import { PageLoader } from '@/components/ui/Spinner'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { ESTADOS, ESTADO_LABEL, type EstadoSolicitud, type SolicitudCompleta } from '@/lib/types'

export default function AdminSolicitudes() {
  const [rows, setRows] = useState<SolicitudCompleta[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [estado, setEstado] = useState<'todos' | EstadoSolicitud>('todos')
  const [categoria, setCategoria] = useState('todas')
  const [cliente, setCliente] = useState('')

  useEffect(() => {
    getTodasLasSolicitudes()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [])

  const categorias = useMemo(
    () => (rows ? [...new Set(rows.map((r) => r.tramite?.categoria).filter(Boolean) as string[])].sort() : []),
    [rows],
  )

  const filtrados = useMemo(() => {
    if (!rows) return []
    const term = cliente.trim().toLowerCase()
    return rows.filter((r) => {
      const mEstado = estado === 'todos' || r.estado === estado
      const mCat = categoria === 'todas' || r.tramite?.categoria === categoria
      const mCli =
        !term ||
        (r.profile?.full_name ?? '').toLowerCase().includes(term) ||
        (r.profile?.datos_personales?.correo ?? '').toLowerCase().includes(term)
      return mEstado && mCat && mCli
    })
  }, [rows, estado, categoria, cliente])

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
  if (!rows) return <PageLoader label="Cargando solicitudes…" />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Solicitudes</h1>
        <p className="text-sm text-slate-500">{filtrados.length} de {rows.length} solicitudes</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)} className="input-field">
          <option value="todos">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
          ))}
        </select>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input-field">
          <option value="todas">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          placeholder="Buscar cliente…"
          className="input-field"
        />
      </div>

      {filtrados.length === 0 ? (
        <p className="card p-8 text-center text-sm text-slate-500">Sin resultados.</p>
      ) : (
        <div className="card overflow-hidden">
          {/* Encabezado de tabla (desktop) */}
          <div className="hidden grid-cols-12 gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase text-slate-500 md:grid">
            <span className="col-span-3">Cliente</span>
            <span className="col-span-4">Trámite</span>
            <span className="col-span-2">Fecha</span>
            <span className="col-span-1 text-right">Monto</span>
            <span className="col-span-2 text-right">Estado</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {filtrados.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/admin/solicitudes/${r.id}`}
                  className="grid grid-cols-2 gap-2 px-4 py-3 text-sm hover:bg-slate-50 md:grid-cols-12 md:items-center md:gap-3"
                >
                  <div className="col-span-2 md:col-span-3">
                    <p className="font-medium text-slate-800">{r.profile?.full_name ?? '—'}</p>
                    <p className="truncate text-xs text-slate-400">
                      {r.profile?.datos_personales?.correo ?? r.profile?.tipo_precio}
                    </p>
                  </div>
                  <div className="col-span-2 md:col-span-4">
                    <p className="text-slate-700">{r.tramite?.nombre}</p>
                    <p className="text-xs text-slate-400">{r.tramite?.categoria}</p>
                  </div>
                  <span className="text-xs text-slate-500 md:col-span-2">{formatFecha(r.created_at)}</span>
                  <span className="font-semibold text-slate-700 md:col-span-1 md:text-right">
                    {formatMXN(r.precio_aplicado)}
                  </span>
                  <div className="col-span-2 flex items-center gap-2 md:col-span-2 md:justify-end">
                    {!r.pagado && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">sin pagar</span>
                    )}
                    <EstadoBadge estado={r.estado} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

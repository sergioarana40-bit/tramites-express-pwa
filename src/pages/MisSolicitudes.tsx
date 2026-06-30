import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getMisSolicitudes, urlDescarga, type MisSolicitudRow } from '@/lib/api'
import { pagarSolicitud } from '@/lib/pagos'
import { useAuth } from '@/context/AuthContext'
import { formatMXN, formatFecha } from '@/lib/format'
import { PageLoader, Spinner } from '@/components/ui/Spinner'
import { EstadoBadge } from '@/components/ui/EstadoBadge'

export default function MisSolicitudes() {
  const { user } = useAuth()
  const location = useLocation()
  const justPaid = (location.state as { justPaid?: string } | null)?.justPaid
  const [rows, setRows] = useState<MisSolicitudRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [pagandoId, setPagandoId] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!user) return
    try {
      setRows(await getMisSolicitudes(user.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    }
  }, [user])

  useEffect(() => {
    cargar()
  }, [cargar])

  const onPagar = async (id: string) => {
    setPagandoId(id)
    try {
      await pagarSolicitud(id)
      await cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo pagar')
    } finally {
      setPagandoId(null)
    }
  }

  const descargar = async (path: string) => {
    try {
      const url = await urlDescarga(path)
      window.open(url, '_blank', 'noopener')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo descargar')
    }
  }

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
  if (!rows) return <PageLoader label="Cargando tus solicitudes…" />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Mis solicitudes</h1>
        <Link to="/" className="btn-primary !py-1.5 text-sm">
          + Nuevo trámite
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-slate-600">Aún no tienes solicitudes.</p>
          <Link to="/" className="mt-3 inline-block text-brand-700 hover:underline">
            Explorar el catálogo →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((s) => {
            const resultados = s.archivos.filter((a) => a.tipo === 'resultado_admin')
            const subidos = s.archivos.filter((a) => a.tipo === 'subido_usuario')
            const open = abierta === s.id
            return (
              <li
                key={s.id}
                className={`card overflow-hidden ${justPaid === s.id ? 'ring-2 ring-emerald-300' : ''}`}
              >
                <button
                  onClick={() => setAbierta(open ? null : s.id)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {s.tramite?.nombre ?? 'Trámite'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {s.tramite?.categoria} · {formatFecha(s.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-semibold text-slate-700">{formatMXN(s.precio_aplicado)}</span>
                    <EstadoBadge estado={s.estado} />
                    <span className="text-slate-400">{open ? '▲' : '▼'}</span>
                  </div>
                </button>

                {open && (
                  <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 p-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.pagado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {s.pagado ? '✓ Pagado' : 'Pago pendiente'}
                      </span>
                      {!s.pagado && s.estado !== 'cancelado' && (
                        <button
                          onClick={() => onPagar(s.id)}
                          disabled={pagandoId === s.id}
                          className="btn-primary !py-1 text-xs"
                        >
                          {pagandoId === s.id ? (
                            <Spinner className="h-3.5 w-3.5 border-white/40 border-t-white" />
                          ) : (
                            `Pagar ${formatMXN(s.precio_aplicado)}`
                          )}
                        </button>
                      )}
                    </div>

                    {/* Datos capturados */}
                    <div>
                      <p className="mb-1 font-medium text-slate-700">Datos capturados</p>
                      <dl className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {Object.entries(s.datos_capturados).map(([k, v]) => (
                          <div key={k} className="rounded bg-white px-2 py-1">
                            <dt className="text-[11px] capitalize text-slate-400">{k}</dt>
                            <dd className="text-slate-700">{String(v)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    {subidos.length > 0 && (
                      <div>
                        <p className="mb-1 font-medium text-slate-700">Documentos que subiste</p>
                        <ul className="space-y-1">
                          {subidos.map((a) => (
                            <li key={a.id}>
                              <button
                                onClick={() => descargar(a.storage_path)}
                                className="text-brand-700 hover:underline"
                              >
                                📎 {a.nombre_archivo}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {s.notas_admin && (
                      <div className="rounded-lg bg-blue-50 px-3 py-2 text-blue-800">
                        <p className="text-[11px] font-medium uppercase">Notas del gestor</p>
                        <p>{s.notas_admin}</p>
                      </div>
                    )}

                    {/* Resultado del trámite */}
                    {resultados.length > 0 ? (
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <p className="mb-1 font-medium text-emerald-800">Resultado de tu trámite</p>
                        <ul className="space-y-1">
                          {resultados.map((a) => (
                            <li key={a.id}>
                              <button
                                onClick={() => descargar(a.storage_path)}
                                className="font-medium text-emerald-700 hover:underline"
                              >
                                ⬇️ Descargar {a.nombre_archivo}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        El documento de resultado aparecerá aquí cuando el gestor lo entregue.
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

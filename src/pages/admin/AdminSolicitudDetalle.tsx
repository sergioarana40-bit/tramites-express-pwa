import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getSolicitud,
  actualizarSolicitud,
  subirArchivos,
  urlDescarga,
  ESTADO_OPTIONS,
} from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { formatMXN, formatFechaHora } from '@/lib/format'
import { PageLoader, Spinner } from '@/components/ui/Spinner'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { FileUpload } from '@/components/FileUpload'
import { CAMPOS_PERFIL, nombreCompleto } from '@/lib/perfilCampos'
import { ESTADO_LABEL, type EstadoSolicitud, type SolicitudCompleta } from '@/lib/types'

export default function AdminSolicitudDetalle() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [sol, setSol] = useState<SolicitudCompleta | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [estado, setEstado] = useState<EstadoSolicitud>('pendiente')
  const [notas, setNotas] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!id) return
    try {
      const s = await getSolicitud(id)
      if (!s) return setNotFound(true)
      setSol(s)
      setEstado(s.estado)
      setNotas(s.notas_admin ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }, [id])

  useEffect(() => {
    cargar()
  }, [cargar])

  if (notFound) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-600">Solicitud no encontrada.</p>
        <Link to="/admin/solicitudes" className="mt-3 inline-block text-brand-700 hover:underline">
          ← Volver
        </Link>
      </div>
    )
  }
  if (!sol) return <PageLoader />

  const subidos = sol.archivos.filter((a) => a.tipo === 'subido_usuario')
  const resultados = sol.archivos.filter((a) => a.tipo === 'resultado_admin')

  const descargar = async (path: string) => {
    try {
      window.open(await urlDescarga(path), '_blank', 'noopener')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo descargar')
    }
  }

  const guardar = async () => {
    setGuardando(true)
    setMsg(null)
    setError(null)
    try {
      await actualizarSolicitud(sol.id, { estado, notas_admin: notas || null })
      setMsg('Cambios guardados')
      await cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  const subirResultado = async () => {
    if (!user || files.length === 0) return
    setSubiendo(true)
    setError(null)
    try {
      await subirArchivos({
        solicitudId: sol.id,
        ownerUserId: sol.user_id, // carpeta del cliente → puede descargarlo
        uploadedBy: user.id,
        tipo: 'resultado_admin',
        files,
      })
      setFiles([])
      setMsg('Resultado subido')
      await cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir el resultado')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/admin/solicitudes" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        ← Solicitudes
      </Link>

      {/* Encabezado */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
              {sol.tramite?.categoria}
            </span>
            <h1 className="text-xl font-bold text-slate-900">{sol.tramite?.nombre}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {sol.profile?.full_name} · <span className="capitalize">{sol.profile?.tipo_precio}</span> ·{' '}
              {formatFechaHora(sol.created_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-brand-700">{formatMXN(sol.precio_aplicado)}</p>
            <span
              className={`text-xs font-medium ${sol.pagado ? 'text-emerald-600' : 'text-amber-600'}`}
            >
              {sol.pagado ? '✓ Pagado' : 'Pago pendiente'}
            </span>
          </div>
        </div>
        <div className="mt-3">
          <EstadoBadge estado={sol.estado} />
        </div>
      </div>

      {(msg || error) && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {error ?? msg}
        </p>
      )}

      {/* Datos del cliente (de su perfil) */}
      <div className="card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Datos del cliente</h2>
          <span className="text-[11px] text-mut">de su perfil</span>
        </div>
        {(() => {
          const datos = sol.profile?.datos_personales ?? {}
          const nombre = nombreCompleto(datos) || sol.profile?.full_name
          const visibles = CAMPOS_PERFIL.filter(
            (c) => c.key !== 'nombre' && c.key !== 'apellidos' && datos[c.key]?.trim(),
          )
          return (
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-paper/60 px-3 py-2">
                <dt className="text-[11px] text-mut">Nombre completo</dt>
                <dd className="text-sm text-ink">{nombre || 'Sin capturar'}</dd>
              </div>
              {visibles.map((c) => (
                <div key={c.key} className="rounded-lg bg-paper/60 px-3 py-2">
                  <dt className="text-[11px] text-mut">{c.label}</dt>
                  <dd className="break-words text-sm text-ink">{datos[c.key]}</dd>
                </div>
              ))}
              {visibles.length === 0 && (
                <p className="text-sm text-mut sm:col-span-2">
                  El cliente aún no completó su perfil.
                </p>
              )}
            </dl>
          )
        })()}
      </div>

      {/* Datos capturados */}
      <div className="card p-6">
        <h2 className="mb-3 font-semibold text-slate-900">Datos capturados en este trámite</h2>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries(sol.datos_capturados).map(([k, v]) => (
            <div key={k} className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-[11px] capitalize text-slate-400">{k}</dt>
              <dd className="break-words text-sm text-slate-700">{String(v)}</dd>
            </div>
          ))}
          {Object.keys(sol.datos_capturados).length === 0 && (
            <p className="text-sm text-slate-400">Sin datos capturados.</p>
          )}
        </dl>
      </div>

      {/* Documentos del cliente */}
      <div className="card p-6">
        <h2 className="mb-3 font-semibold text-slate-900">Documentos del cliente</h2>
        {subidos.length ? (
          <ul className="space-y-1 text-sm">
            {subidos.map((a) => (
              <li key={a.id}>
                <button onClick={() => descargar(a.storage_path)} className="text-brand-700 hover:underline">
                  📎 {a.nombre_archivo}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">El cliente no subió documentos.</p>
        )}
      </div>

      {/* Guía de procesamiento (del catálogo) */}
      {sol.tramite && (sol.tramite.validaciones_requeridas || sol.tramite.prerequisitos_reales) && (
        <div className="card border-brand-100 bg-brand-50/40 p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-ink">Guía de procesamiento</h2>
            {sol.tramite.nivel_automatizacion && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-ink2">
                {sol.tramite.nivel_automatizacion}
              </span>
            )}
            {sol.tramite.ambito && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-ink2">
                {sol.tramite.ambito}
              </span>
            )}
          </div>
          <div className="space-y-3 text-sm">
            {sol.tramite.prerequisitos_reales && (
              <Bloque titulo="Prerrequisitos" texto={sol.tramite.prerequisitos_reales} />
            )}
            {sol.tramite.validaciones_requeridas && (
              <Bloque titulo="Validaciones a confirmar" texto={sol.tramite.validaciones_requeridas} />
            )}
            {sol.tramite.que_se_automatiza && (
              <Bloque titulo="Qué se automatiza" texto={sol.tramite.que_se_automatiza} />
            )}
            {sol.tramite.que_queda_manual && (
              <Bloque titulo="Qué queda manual" texto={sol.tramite.que_queda_manual} />
            )}
            {/^(s[ií]|parcial)/i.test(sol.tramite.requiere_credenciales_cliente) && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                🔒 Requiere credenciales del cliente: {sol.tramite.requiere_credenciales_cliente}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Gestión: estado + notas */}
      <div className="card p-6">
        <h2 className="mb-3 font-semibold text-slate-900">Gestión</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoSolicitud)} className="input-field sm:w-64">
              {ESTADO_OPTIONS.map((e) => (
                <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notas para el cliente</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="input-field"
              placeholder="Notas visibles para el cliente…"
            />
          </div>
          <button onClick={guardar} disabled={guardando} className="btn-primary">
            {guardando ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Resultado */}
      <div className="card p-6">
        <h2 className="mb-1 font-semibold text-slate-900">Documento de resultado</h2>
        <p className="mb-4 text-xs text-slate-500">
          Sube el documento final; el cliente podrá descargarlo desde "Mis solicitudes".
        </p>
        {resultados.length > 0 && (
          <ul className="mb-4 space-y-1 rounded-lg bg-emerald-50 p-3 text-sm">
            {resultados.map((a) => (
              <li key={a.id}>
                <button onClick={() => descargar(a.storage_path)} className="font-medium text-emerald-700 hover:underline">
                  ⬇️ {a.nombre_archivo}
                </button>
              </li>
            ))}
          </ul>
        )}
        <FileUpload files={files} onChange={setFiles} />
        <button
          onClick={subirResultado}
          disabled={subiendo || files.length === 0}
          className="btn-primary mt-3"
        >
          {subiendo ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Subir resultado'}
        </button>
      </div>
    </div>
  )
}

function Bloque({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-mut">{titulo}</p>
      <p className="leading-relaxed text-ink2">{texto}</p>
    </div>
  )
}

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getTramite, crearSolicitud, subirArchivos } from '@/lib/api'
import { pagarSolicitud } from '@/lib/pagos'
import { useAuth } from '@/context/AuthContext'
import { formatMXN, precioPara, parseCampos } from '@/lib/format'
import { autollenar, perfilCompletitud } from '@/lib/perfilCampos'
import { PageLoader, Spinner } from '@/components/ui/Spinner'
import { DynamicForm } from '@/components/DynamicForm'
import { FileUpload } from '@/components/FileUpload'
import type { Solicitud, Tramite } from '@/lib/types'

export default function TramiteDetalle() {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const tipo = profile?.tipo_precio ?? 'publico'

  const [tramite, setTramite] = useState<Tramite | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [autollenados, setAutollenados] = useState<Set<string>>(new Set())
  const [files, setFiles] = useState<File[]>([])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creada, setCreada] = useState<Solicitud | null>(null)
  const [pagando, setPagando] = useState(false)

  useEffect(() => {
    if (!id) return
    getTramite(id)
      .then((t) => (t ? setTramite(t) : setNotFound(true)))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [id])

  const campos = useMemo(() => (tramite ? parseCampos(tramite.datos_requeridos) : []), [tramite])
  const docs = useMemo(
    () => (tramite ? parseCampos(tramite.documentos_requeridos) : []),
    [tramite],
  )
  const precio = tramite ? precioPara(tramite, tipo) : 0

  // Autollenado desde el perfil cuando carga el trámite.
  useEffect(() => {
    if (!tramite) return
    const { valores, autollenados } = autollenar(
      parseCampos(tramite.datos_requeridos),
      profile?.datos_personales,
    )
    setValues(valores)
    setAutollenados(autollenados)
  }, [tramite, profile])

  const { llenos: perfilLlenos } = perfilCompletitud(profile?.datos_personales)

  if (notFound) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-600">Trámite no encontrado.</p>
        <Link to="/" className="mt-3 inline-block text-brand-700 hover:underline">
          ← Volver al catálogo
        </Link>
      </div>
    )
  }
  if (!tramite) return <PageLoader />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError(null)

    const faltantes = campos.filter((c) => !(values[c] ?? '').trim())
    if (faltantes.length) {
      setError(`Completa todos los campos requeridos (${faltantes.length} pendiente(s)).`)
      return
    }

    setEnviando(true)
    try {
      const solicitud = await crearSolicitud({
        userId: user.id,
        tramiteId: tramite.id,
        datosCapturados: values,
        precioAplicado: precio,
      })
      if (files.length) {
        await subirArchivos({
          solicitudId: solicitud.id,
          ownerUserId: user.id,
          uploadedBy: user.id,
          tipo: 'subido_usuario',
          files,
        })
      }
      setCreada(solicitud)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la solicitud')
    } finally {
      setEnviando(false)
    }
  }

  const onPagar = async () => {
    if (!creada) return
    setPagando(true)
    try {
      await pagarSolicitud(creada.id)
      navigate('/mis-solicitudes', { state: { justPaid: creada.id } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar el pago')
      setPagando(false)
    }
  }

  // ----- Pantalla de éxito tras crear la solicitud -----
  if (creada) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
            ✓
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">¡Solicitud creada!</h1>
          <p className="mt-1 text-sm text-slate-500">
            {tramite.nombre} · estado <span className="font-medium">pendiente</span>
          </p>
          <p className="mt-4 text-sm text-slate-600">
            Total a pagar: <span className="font-bold text-brand-700">{formatMXN(precio)}</span>
          </p>

          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="mt-6 flex flex-col gap-2">
            <button onClick={onPagar} disabled={pagando} className="btn-primary w-full">
              {pagando ? (
                <Spinner className="h-4 w-4 border-white/40 border-t-white" />
              ) : (
                <>Pagar {formatMXN(precio)} (simulado)</>
              )}
            </button>
            <Link to="/mis-solicitudes" className="btn-secondary w-full">
              Pagar después · ver mis solicitudes
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            El pago es simulado para la demo. No se realiza ningún cargo real.
          </p>
        </div>
      </div>
    )
  }

  // ----- Formulario de solicitud -----
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        ← Catálogo
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
            {tramite.categoria}
          </span>
          {tramite.ambito && (
            <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] font-semibold text-ink2">
              {tramite.ambito}
            </span>
          )}
        </div>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{tramite.nombre}</h1>
        {tramite.descripcion && <p className="mt-2 text-sm text-slate-600">{tramite.descripcion}</p>}
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-brand-700">{formatMXN(precio)}</span>
          <span className="text-xs capitalize text-slate-400">precio {tipo}</span>
        </div>
      </div>

      {/* Requisitos: qué necesitas antes de empezar */}
      <div className="card border-brand-100 bg-brand-50/40 p-6">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
          📋 Qué necesitas para este trámite
        </h2>

        {/* Requisitos previos reales (lo que debes cumplir antes de empezar) */}
        {tramite.prerequisitos_reales && (
          <div className="mb-4 rounded-xl border border-line bg-white p-3.5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-mut">
              Requisitos previos
            </p>
            <p className="text-sm leading-relaxed text-ink2">{tramite.prerequisitos_reales}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Información
            </p>
            {campos.length ? (
              <ul className="space-y-1 text-sm text-slate-700">
                {campos.map((c) => (
                  <li key={c} className="flex items-center gap-2">
                    <span className="text-brand-500">•</span>
                    <span className="capitalize">{c}</span>
                    {autollenados.has(c) && (
                      <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                        ✓ de tu perfil
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No se requiere capturar datos.</p>
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Documentos a subir
            </p>
            {docs.length ? (
              <ul className="space-y-1 text-sm text-slate-700">
                {docs.map((d) => (
                  <li key={d} className="flex items-center gap-2">
                    <span className="text-brand-500">📎</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No se requieren documentos.</p>
            )}
          </div>
        </div>

        {/* Aviso de credenciales sensibles */}
        {/^(s[ií]|parcial)/i.test(tramite.requiere_credenciales_cliente) && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            <svg className="mt-0.5 h-4 w-4 flex-none text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <p>
              Este trámite usa <b className="font-semibold">tus credenciales</b> ({tramite.requiere_credenciales_cliente.replace(/\s*-\s*NO almacenar.*/i, '')}).
              Por seguridad <b className="font-semibold">no las almacenamos</b>: se usan solo en vivo al procesarlo.
            </p>
          </div>
        )}

        {/* Aviso de autollenado / sugerencia de completar perfil */}
        {autollenados.size > 0 ? (
          <p className="mt-4 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
            ✏️ Rellenamos {autollenados.size} dato(s) desde tu perfil. Revísalos y edítalos si hace falta.
          </p>
        ) : perfilLlenos === 0 ? (
          <p className="mt-4 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
            💡 <Link to="/mi-perfil" className="font-medium text-brand-700 hover:underline">Completa tu perfil</Link>{' '}
            y la próxima vez estos datos se llenarán solos.
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="card p-6">
          <h2 className="mb-1 font-semibold text-slate-900">Datos requeridos</h2>
          <p className="mb-4 text-xs text-slate-500">Completa la información para procesar tu trámite.</p>
          {campos.length ? (
            <DynamicForm campos={campos} values={values} onChange={setValues} autollenados={autollenados} />
          ) : (
            <p className="text-sm text-slate-500">Este trámite no requiere capturar datos.</p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-1 font-semibold text-slate-900">
            Documentos {docs.length ? '' : '(opcional)'}
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            {docs.length
              ? `Sube: ${docs.join(', ')}.`
              : 'Adjunta los documentos que respalden tu trámite.'}
          </p>
          <FileUpload files={files} onChange={setFiles} />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-500">
            Total: <span className="font-bold text-slate-900">{formatMXN(precio)}</span>
          </span>
          <button type="submit" disabled={enviando} className="btn-primary">
            {enviando ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Crear solicitud'}
          </button>
        </div>
      </form>
    </div>
  )
}

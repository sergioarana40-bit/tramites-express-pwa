import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  getTramites,
  crearTramite,
  actualizarTramite,
  eliminarTramite,
  type TramiteInput,
} from '@/lib/api'
import { formatMXN } from '@/lib/format'
import { PageLoader, Spinner } from '@/components/ui/Spinner'
import type { Tramite } from '@/lib/types'

const VACIO: TramiteInput = {
  categoria: '',
  nombre: '',
  descripcion: '',
  datos_requeridos: '',
  documentos_requeridos: '',
  precio_publico: 0,
  precio_mayorista: 0,
  activo: true,
}

export default function AdminCatalogo() {
  const [rows, setRows] = useState<Tramite[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null) // null = cerrado, '' = nuevo
  const [form, setForm] = useState<TramiteInput>(VACIO)
  const [saving, setSaving] = useState(false)
  const [q, setQ] = useState('')

  const cargar = useCallback(async () => {
    try {
      setRows(await getTramites())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const categorias = useMemo(
    () => (rows ? [...new Set(rows.map((r) => r.categoria))].sort() : []),
    [rows],
  )

  const filtrados = useMemo(() => {
    if (!rows) return []
    const term = q.trim().toLowerCase()
    return term
      ? rows.filter((r) => r.nombre.toLowerCase().includes(term) || r.categoria.toLowerCase().includes(term))
      : rows
  }, [rows, q])

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
  if (!rows) return <PageLoader label="Cargando catálogo…" />

  const abrirNuevo = () => {
    setForm(VACIO)
    setEditId('')
  }
  const abrirEditar = (t: Tramite) => {
    setForm({
      categoria: t.categoria,
      nombre: t.nombre,
      descripcion: t.descripcion ?? '',
      datos_requeridos: t.datos_requeridos,
      documentos_requeridos: t.documentos_requeridos,
      precio_publico: t.precio_publico,
      precio_mayorista: t.precio_mayorista,
      activo: t.activo,
    })
    setEditId(t.id)
  }

  const guardar = async () => {
    if (!form.nombre.trim() || !form.categoria.trim()) {
      setError('Nombre y categoría son obligatorios')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editId) await actualizarTramite(editId, form)
      else await crearTramite(form)
      setEditId(null)
      await cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const toggleActivo = async (t: Tramite) => {
    await actualizarTramite(t.id, { activo: !t.activo })
    await cargar()
  }

  const borrar = async (t: Tramite) => {
    if (!confirm(`¿Eliminar "${t.nombre}"? Si tiene solicitudes, mejor desactívalo.`)) return
    try {
      await eliminarTramite(t.id)
      await cargar()
    } catch {
      setError('No se pudo eliminar (probablemente tiene solicitudes). Desactívalo en su lugar.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catálogo</h1>
          <p className="text-sm text-slate-500">{rows.length} trámites</p>
        </div>
        <button onClick={abrirNuevo} className="btn-primary !py-1.5 text-sm">+ Nuevo trámite</button>
      </div>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="input-field" />

      <div className="card overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {filtrados.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-slate-800">{t.nombre}</p>
                  {!t.activo && (
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">inactivo</span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{t.categoria}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-slate-700">{formatMXN(t.precio_publico)}</p>
                <p className="text-xs text-slate-400">may. {formatMXN(t.precio_mayorista)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleActivo(t)} className="btn-secondary !px-2 !py-1 text-xs" title={t.activo ? 'Desactivar' : 'Activar'}>
                  {t.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => abrirEditar(t)} className="btn-secondary !px-2 !py-1 text-xs">Editar</button>
                <button onClick={() => borrar(t)} className="btn-secondary !px-2 !py-1 text-xs !text-red-600" title="Eliminar">✕</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Modal de formulario */}
      {editId !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="card max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-b-none p-6 sm:rounded-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              {editId ? 'Editar trámite' : 'Nuevo trámite'}
            </h2>
            <div className="space-y-3">
              <Field label="Nombre">
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" />
              </Field>
              <Field label="Categoría">
                <input
                  list="categorias-list"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="input-field"
                />
                <datalist id="categorias-list">
                  {categorias.map((c) => <option key={c} value={c} />)}
                </datalist>
              </Field>
              <Field label="Descripción">
                <textarea value={form.descripcion ?? ''} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} className="input-field" />
              </Field>
              <Field label="Datos requeridos (separados por coma)">
                <textarea value={form.datos_requeridos} onChange={(e) => setForm({ ...form, datos_requeridos: e.target.value })} rows={2} className="input-field" placeholder="RFC, contraseña SAT, correo" />
              </Field>
              <Field label="Documentos requeridos (separados por coma)">
                <textarea value={form.documentos_requeridos} onChange={(e) => setForm({ ...form, documentos_requeridos: e.target.value })} rows={2} className="input-field" placeholder="INE, acta de nacimiento" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Precio público">
                  <input type="number" step="0.01" min="0" value={form.precio_publico} onChange={(e) => setForm({ ...form, precio_publico: Number(e.target.value) })} className="input-field" />
                </Field>
                <Field label="Precio mayorista">
                  <input type="number" step="0.01" min="0" value={form.precio_mayorista} onChange={(e) => setForm({ ...form, precio_mayorista: Number(e.target.value) })} className="input-field" />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                Activo (visible en el catálogo)
              </label>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditId(null)} className="btn-secondary">Cancelar</button>
              <button onClick={guardar} disabled={saving} className="btn-primary">
                {saving ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

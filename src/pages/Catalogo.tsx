import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTramites } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { formatMXN, precioPara } from '@/lib/format'
import { PageLoader } from '@/components/ui/Spinner'
import type { Tramite } from '@/lib/types'

export default function Catalogo() {
  const { profile } = useAuth()
  const tipo = profile?.tipo_precio ?? 'publico'
  const [tramites, setTramites] = useState<Tramite[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [categoria, setCategoria] = useState<string>('todas')

  useEffect(() => {
    getTramites()
      .then(setTramites)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar'))
  }, [])

  const categorias = useMemo(
    () => (tramites ? [...new Set(tramites.map((t) => t.categoria))].sort() : []),
    [tramites],
  )

  const filtrados = useMemo(() => {
    if (!tramites) return []
    const term = q.trim().toLowerCase()
    return tramites.filter((t) => {
      const matchCat = categoria === 'todas' || t.categoria === categoria
      const matchText =
        !term ||
        t.nombre.toLowerCase().includes(term) ||
        t.categoria.toLowerCase().includes(term) ||
        (t.descripcion ?? '').toLowerCase().includes(term)
      return matchCat && matchText
    })
  }, [tramites, q, categoria])

  const porCategoria = useMemo(() => {
    const map = new Map<string, Tramite[]>()
    for (const t of filtrados) {
      if (!map.has(t.categoria)) map.set(t.categoria, [])
      map.get(t.categoria)!.push(t)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtrados])

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
  if (!tramites) return <PageLoader label="Cargando catálogo…" />

  const nombre = profile?.full_name?.split(' ')[0]

  return (
    <div className="space-y-5">
      <div>
        {nombre && <p className="text-sm font-medium text-mut">Hola, {nombre}</p>}
        <h1 className="text-3xl font-semibold text-ink">Catálogo</h1>
        <p className="mt-1 text-sm text-mut">
          Precios para tu cuenta <span className="font-semibold capitalize text-brand-700">{tipo}</span>
        </p>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-2.5 rounded-xl border border-line bg-[#fbfbf9] px-3.5 py-3">
        <svg className="h-4 w-4 flex-none text-mut" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar trámite…"
          className="w-full bg-transparent text-sm text-ink placeholder:text-mut focus:outline-none"
        />
      </div>

      {/* Chips de categoría */}
      <div className="ns -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button onClick={() => setCategoria('todas')} className={categoria === 'todas' ? 'chip-active' : 'chip'}>
          Todas
        </button>
        {categorias.map((c) => (
          <button key={c} onClick={() => setCategoria(c)} className={categoria === c ? 'chip-active' : 'chip'}>
            {c}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <p className="card p-8 text-center text-sm text-mut">
          No se encontraron trámites con esos criterios.
        </p>
      ) : (
        porCategoria.map(([cat, items]) => (
          <section key={cat}>
            <div className="mb-3 flex items-center gap-2.5">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-mut">{cat}</h2>
              <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-bold text-ink2">
                {items.length}
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => (
                <Link
                  key={t.id}
                  to={`/tramite/${t.id}`}
                  className="card flex flex-col p-4 transition-shadow hover:shadow-soft"
                >
                  <h3 className="font-semibold leading-snug text-ink">{t.nombre}</h3>
                  {t.descripcion && (
                    <p className="mt-1 line-clamp-2 text-xs text-mut">{t.descripcion}</p>
                  )}
                  <div className="mt-auto flex items-end justify-between pt-3">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-xl font-semibold text-ink">
                        {formatMXN(precioPara(t, tipo))}
                      </span>
                      {tipo === 'mayorista' && (
                        <span className="text-xs text-mut line-through">{formatMXN(t.precio_publico)}</span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-brand-600">
                      Solicitar
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

import type { SolicitudCompleta, EstadoSolicitud } from './types'
import { ESTADO_LABEL } from './types'

const ESTADOS_INGRESO: EstadoSolicitud[] = ['completado', 'entregado']

export interface DashboardStats {
  ingresosTotales: number
  totalSolicitudes: number
  activas: number // pendiente + en_proceso
  ticketPromedio: number
  porEstado: { estado: EstadoSolicitud; label: string; value: number }[]
  topTramites: { nombre: string; value: number }[]
  porCategoria: { categoria: string; value: number }[]
  tendencia: { mes: string; solicitudes: number; ingresos: number }[]
}

const cuentaIngreso = (s: Pick<SolicitudCompleta, 'estado'>) =>
  ESTADOS_INGRESO.includes(s.estado)

export function computeStats(rows: SolicitudCompleta[], meses = 6): DashboardStats {
  const ingresosTotales = rows.filter(cuentaIngreso).reduce((a, s) => a + Number(s.precio_aplicado), 0)
  const conIngreso = rows.filter(cuentaIngreso).length
  const activas = rows.filter((s) => s.estado === 'pendiente' || s.estado === 'en_proceso').length

  // Por estado
  const estadoMap = new Map<EstadoSolicitud, number>()
  for (const s of rows) estadoMap.set(s.estado, (estadoMap.get(s.estado) ?? 0) + 1)
  const porEstado = (Object.keys(ESTADO_LABEL) as EstadoSolicitud[])
    .map((estado) => ({ estado, label: ESTADO_LABEL[estado], value: estadoMap.get(estado) ?? 0 }))
    .filter((e) => e.value > 0)

  // Top trámites
  const tramiteMap = new Map<string, number>()
  for (const s of rows) {
    const n = s.tramite?.nombre ?? '—'
    tramiteMap.set(n, (tramiteMap.get(n) ?? 0) + 1)
  }
  const topTramites = [...tramiteMap.entries()]
    .map(([nombre, value]) => ({ nombre, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // Por categoría
  const catMap = new Map<string, number>()
  for (const s of rows) {
    const c = s.tramite?.categoria ?? '—'
    catMap.set(c, (catMap.get(c) ?? 0) + 1)
  }
  const porCategoria = [...catMap.entries()]
    .map(([categoria, value]) => ({ categoria, value }))
    .sort((a, b) => b.value - a.value)

  // Tendencia mensual (últimos N meses, incluyendo el actual)
  const ahora = new Date()
  const buckets: { mes: string; key: string; solicitudes: number; ingresos: number }[] = []
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      mes: d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
      solicitudes: 0,
      ingresos: 0,
    })
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]))
  for (const s of rows) {
    const d = new Date(s.created_at)
    const k = `${d.getFullYear()}-${d.getMonth()}`
    const i = idx.get(k)
    if (i === undefined) continue
    buckets[i].solicitudes += 1
    if (cuentaIngreso(s)) buckets[i].ingresos += Number(s.precio_aplicado)
  }

  return {
    ingresosTotales,
    totalSolicitudes: rows.length,
    activas,
    ticketPromedio: conIngreso ? ingresosTotales / conIngreso : 0,
    porEstado,
    topTramites,
    porCategoria,
    tendencia: buckets.map(({ mes, solicitudes, ingresos }) => ({ mes, solicitudes, ingresos })),
  }
}

// Colores por estado (alineados con los badges).
export const COLOR_ESTADO: Record<EstadoSolicitud, string> = {
  pendiente: '#f59e0b',
  en_proceso: '#3b82f6',
  completado: '#8b5cf6',
  entregado: '#10b981',
  cancelado: '#94a3b8',
}

// Paleta para categorías.
export const PALETA = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1', '#14b8a6', '#f97316']

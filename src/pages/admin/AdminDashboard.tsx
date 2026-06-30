import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'
import { getTodasLasSolicitudes } from '@/lib/api'
import { computeStats, COLOR_ESTADO, PALETA } from '@/lib/stats'
import { formatMXN } from '@/lib/format'
import { PageLoader } from '@/components/ui/Spinner'
import type { SolicitudCompleta } from '@/lib/types'

export default function AdminDashboard() {
  const [rows, setRows] = useState<SolicitudCompleta[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getTodasLasSolicitudes()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [])

  const stats = useMemo(() => (rows ? computeStats(rows) : null), [rows])

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
  if (!stats) return <PageLoader label="Cargando estadísticas…" />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Ingresos totales" value={formatMXN(stats.ingresosTotales)} accent="text-emerald-600" />
        <Kpi label="Solicitudes" value={String(stats.totalSolicitudes)} />
        <Kpi label="Activas (pend. + proceso)" value={String(stats.activas)} accent="text-amber-600" />
        <Kpi label="Ticket promedio" value={formatMXN(stats.ticketPromedio)} />
      </div>

      {/* Tendencia mensual */}
      <Panel title="Tendencia mensual">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={stats.tendencia} margin={{ left: -10, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip
              formatter={(value, name) =>
                name === 'Ingresos' ? formatMXN(Number(value)) : String(value)
              }
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="ingresos"
              name="Ingresos"
              stroke="#0d9488"
              fill="url(#gradIngresos)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={stats.tendencia} margin={{ left: -10, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="solicitudes" name="Solicitudes" stroke="#3b82f6" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Por estado */}
        <Panel title="Solicitudes por estado">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={stats.porEstado}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(e: { label?: string; value?: number }) => `${e.label}: ${e.value}`}
                labelLine={false}
              >
                {stats.porEstado.map((e) => (
                  <Cell key={e.estado} fill={COLOR_ESTADO[e.estado]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        {/* Por categoría */}
        <Panel title="Solicitudes por categoría">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.porCategoria} layout="vertical" margin={{ left: 20, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis type="category" dataKey="categoria" width={120} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip />
              <Bar dataKey="value" name="Solicitudes" radius={[0, 4, 4, 0]}>
                {stats.porCategoria.map((_, i) => (
                  <Cell key={i} fill={PALETA[i % PALETA.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Top trámites */}
      <Panel title="Trámites más solicitados">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.topTramites} margin={{ left: 0, right: 16, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
            <XAxis dataKey="nombre" angle={-25} textAnchor="end" interval={0} height={70} tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip />
            <Bar dataKey="value" name="Solicitudes" fill="#0d9488" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  )
}

function Kpi({ label, value, accent = 'text-slate-900' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent}`}>{value}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">{title}</h2>
      {children}
    </div>
  )
}

import type { EstadoSolicitud } from '@/lib/types'
import { ESTADO_LABEL } from '@/lib/types'

const STYLES: Record<EstadoSolicitud, string> = {
  pendiente: 'bg-amber-100 text-amber-800 ring-amber-200',
  en_proceso: 'bg-blue-100 text-blue-800 ring-blue-200',
  completado: 'bg-violet-100 text-violet-800 ring-violet-200',
  entregado: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  cancelado: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function EstadoBadge({ estado }: { estado: EstadoSolicitud }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[estado]}`}
    >
      {ESTADO_LABEL[estado]}
    </span>
  )
}

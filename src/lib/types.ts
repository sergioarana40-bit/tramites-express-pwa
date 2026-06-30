// Tipos del dominio. Reflejan el esquema de Postgres (ver supabase/migrations).
// Tras cambios de esquema se pueden regenerar con la CLI de Supabase.

export type Rol = 'admin' | 'cliente'
export type TipoPrecio = 'publico' | 'mayorista'
export type EstadoSolicitud =
  | 'pendiente'
  | 'en_proceso'
  | 'completado'
  | 'entregado'
  | 'cancelado'
export type TipoArchivo = 'subido_usuario' | 'resultado_admin'

export interface Profile {
  id: string
  full_name: string | null
  role: Rol
  tipo_precio: TipoPrecio
  datos_personales: Record<string, string>
  created_at: string
}

export interface Tramite {
  id: string
  categoria: string
  nombre: string
  descripcion: string | null
  datos_requeridos: string
  documentos_requeridos: string
  precio_publico: number
  precio_mayorista: number
  activo: boolean
  created_at: string
}

export interface Solicitud {
  id: string
  user_id: string
  tramite_id: string
  estado: EstadoSolicitud
  datos_capturados: Record<string, string>
  precio_aplicado: number
  pagado: boolean
  notas_admin: string | null
  created_at: string
  updated_at: string
}

export interface Notificacion {
  id: string
  user_id: string
  solicitud_id: string | null
  tipo: string
  titulo: string
  mensaje: string
  leida: boolean
  created_at: string
}

export interface Archivo {
  id: string
  solicitud_id: string
  tipo: TipoArchivo
  storage_path: string
  nombre_archivo: string
  uploaded_by: string | null
  created_at: string
}

// Filas con relaciones embebidas (joins habituales en la UI).
export type SolicitudConTramite = Solicitud & { tramite: Tramite | null }
export type SolicitudCompleta = Solicitud & {
  tramite: Tramite | null
  profile: Profile | null
  archivos: Archivo[]
}

export const ESTADOS: EstadoSolicitud[] = [
  'pendiente',
  'en_proceso',
  'completado',
  'entregado',
  'cancelado',
]

export const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completado: 'Completado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

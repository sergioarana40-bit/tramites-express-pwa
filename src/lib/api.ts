import { supabase, STORAGE_BUCKET } from './supabase'
import type {
  Tramite,
  Solicitud,
  SolicitudConTramite,
  SolicitudCompleta,
  Archivo,
  EstadoSolicitud,
  Profile,
  TipoPrecio,
  Notificacion,
} from './types'

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

export async function getTramites(): Promise<Tramite[]> {
  const { data, error } = await supabase
    .from('tramites')
    .select('*')
    .order('categoria')
    .order('nombre')
  if (error) throw error
  return data as Tramite[]
}

export async function getTramite(id: string): Promise<Tramite | null> {
  const { data, error } = await supabase.from('tramites').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Tramite | null
}

// ---------------------------------------------------------------------------
// Solicitudes (cliente)
// ---------------------------------------------------------------------------

export async function crearSolicitud(input: {
  userId: string
  tramiteId: string
  datosCapturados: Record<string, string>
  precioAplicado: number
}): Promise<Solicitud> {
  const { data, error } = await supabase
    .from('solicitudes')
    .insert({
      user_id: input.userId,
      tramite_id: input.tramiteId,
      datos_capturados: input.datosCapturados,
      precio_aplicado: input.precioAplicado,
      estado: 'pendiente',
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Solicitud
}

export type MisSolicitudRow = SolicitudConTramite & { archivos: Archivo[] }

export async function getMisSolicitudes(userId: string): Promise<MisSolicitudRow[]> {
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*, tramite:tramites(*), archivos(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as MisSolicitudRow[]
}

export async function getSolicitud(id: string): Promise<SolicitudCompleta | null> {
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*, tramite:tramites(*), profile:profiles(*), archivos(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as unknown as SolicitudCompleta | null
}

// ---------------------------------------------------------------------------
// Archivos / Storage
// ---------------------------------------------------------------------------

const sanitize = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')

/**
 * Sube archivos al bucket privado y registra las filas en `archivos`.
 * Ruta: {ownerUserId}/{solicitudId}/{archivo}  (el primer segmento = dueño,
 * lo que permite las políticas de storage y que el cliente baje su resultado).
 */
export async function subirArchivos(params: {
  solicitudId: string
  ownerUserId: string
  uploadedBy: string
  tipo: Archivo['tipo']
  files: File[]
}): Promise<void> {
  for (const file of params.files) {
    const path = `${params.ownerUserId}/${params.solicitudId}/${Date.now()}_${sanitize(file.name)}`
    const { error: upErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: false })
    if (upErr) throw upErr

    const { error: rowErr } = await supabase.from('archivos').insert({
      solicitud_id: params.solicitudId,
      tipo: params.tipo,
      storage_path: path,
      nombre_archivo: file.name,
      uploaded_by: params.uploadedBy,
    })
    if (rowErr) throw rowErr
  }
}

export async function getArchivos(solicitudId: string): Promise<Archivo[]> {
  const { data, error } = await supabase
    .from('archivos')
    .select('*')
    .eq('solicitud_id', solicitudId)
    .order('created_at')
  if (error) throw error
  return data as Archivo[]
}

/** URL firmada temporal para descargar un archivo del bucket privado. */
export async function urlDescarga(storagePath: string, segundos = 120): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, segundos)
  if (error) throw error
  return data.signedUrl
}

// ---------------------------------------------------------------------------
// Solicitudes (admin)
// ---------------------------------------------------------------------------

export async function getTodasLasSolicitudes(): Promise<SolicitudCompleta[]> {
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*, tramite:tramites(*), profile:profiles(*), archivos(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as SolicitudCompleta[]
}

export async function actualizarSolicitud(
  id: string,
  cambios: Partial<Pick<Solicitud, 'estado' | 'notas_admin'>>,
): Promise<void> {
  const { error } = await supabase.from('solicitudes').update(cambios).eq('id', id)
  if (error) throw error
}

export const ESTADO_OPTIONS: EstadoSolicitud[] = [
  'pendiente',
  'en_proceso',
  'completado',
  'entregado',
  'cancelado',
]

// ---------------------------------------------------------------------------
// CRUD de catálogo (admin)
// ---------------------------------------------------------------------------

export type TramiteInput = Pick<
  Tramite,
  | 'categoria'
  | 'nombre'
  | 'descripcion'
  | 'datos_requeridos'
  | 'documentos_requeridos'
  | 'precio_publico'
  | 'precio_mayorista'
  | 'activo'
>

export async function crearTramite(input: TramiteInput): Promise<Tramite> {
  const { data, error } = await supabase.from('tramites').insert(input).select('*').single()
  if (error) throw error
  return data as Tramite
}

export async function actualizarTramite(id: string, cambios: Partial<TramiteInput>): Promise<void> {
  const { error } = await supabase.from('tramites').update(cambios).eq('id', id)
  if (error) throw error
}

export async function eliminarTramite(id: string): Promise<void> {
  const { error } = await supabase.from('tramites').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Usuarios (admin)
// ---------------------------------------------------------------------------

export async function getUsuarios(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Profile[]
}

export async function actualizarTipoPrecio(id: string, tipo: TipoPrecio): Promise<void> {
  const { error } = await supabase.from('profiles').update({ tipo_precio: tipo }).eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Perfil del cliente (datos personales reutilizables)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Notificaciones
// ---------------------------------------------------------------------------

export async function getNotificaciones(userId: string, limite = 30): Promise<Notificacion[]> {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limite)
  if (error) throw error
  return data as Notificacion[]
}

export async function marcarLeida(id: string): Promise<void> {
  const { error } = await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
  if (error) throw error
}

export async function marcarTodasLeidas(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('user_id', userId)
    .eq('leida', false)
  if (error) throw error
}

export async function guardarPerfil(input: {
  id: string
  fullName: string
  datosPersonales: Record<string, string>
}): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: input.fullName, datos_personales: input.datosPersonales })
    .eq('id', input.id)
  if (error) throw error
}

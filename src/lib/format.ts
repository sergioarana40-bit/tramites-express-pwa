import type { TipoPrecio, Tramite } from './types'

const mxn = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

export const formatMXN = (n: number) => mxn.format(n)

export const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

export const formatFechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

/** Precio que le corresponde a un cliente según su tipo de precio. */
export const precioPara = (tramite: Pick<Tramite, 'precio_publico' | 'precio_mayorista'>, tipo: TipoPrecio) =>
  tipo === 'mayorista' ? tramite.precio_mayorista : tramite.precio_publico

/** Convierte "RFC, contraseña SAT, correo" -> ["RFC","contraseña SAT","correo"]. */
export const parseCampos = (datosRequeridos: string): string[] =>
  datosRequeridos
    .split(/[,\n/]+/)
    .map((c) => c.trim())
    .filter(Boolean)

/** Heurística para marcar campos sensibles (contraseñas/credenciales). */
export const esCampoSensible = (label: string): boolean =>
  /contrase|password|usuario y contrase|nip|pin|clave de acceso/i.test(label)

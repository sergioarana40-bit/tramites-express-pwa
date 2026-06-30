// ============================================================================
// Registro de "datos personales" canónicos del cliente.
// Sirve para (1) construir el formulario de "Mi perfil" / registro y (2)
// autollenar los formularios dinámicos de los trámites: cada campo del trámite
// se compara contra estos matchers y, si coincide y el perfil tiene el dato,
// se rellena. El nombre completo se deriva de nombre + apellidos.
// ============================================================================

export interface CampoPerfil {
  key: string
  label: string
  type: 'text' | 'email' | 'tel' | 'date'
  placeholder?: string
  /** Determina si la etiqueta de un campo de trámite corresponde a este dato. */
  match: (labelNormalizado: string) => boolean
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()

export const CAMPOS_PERFIL: CampoPerfil[] = [
  {
    key: 'nombre',
    label: 'Nombre(s)',
    type: 'text',
    placeholder: 'Tu(s) nombre(s)',
    match: (l) => /nombre/.test(l) && !/apellido|completo/.test(l),
  },
  {
    key: 'apellidos',
    label: 'Apellidos',
    type: 'text',
    placeholder: 'Apellido paterno y materno',
    match: (l) => /apellido/.test(l),
  },
  {
    key: 'curp',
    label: 'CURP',
    type: 'text',
    placeholder: '18 caracteres',
    match: (l) => /\bcurp\b/.test(l),
  },
  {
    key: 'rfc',
    label: 'RFC',
    type: 'text',
    placeholder: 'Con homoclave',
    match: (l) => /\brfc\b/.test(l),
  },
  {
    key: 'correo',
    label: 'Correo electrónico',
    type: 'email',
    placeholder: 'tucorreo@ejemplo.com',
    match: (l) => /correo|email|e-mail/.test(l),
  },
  {
    key: 'telefono',
    label: 'Teléfono / celular',
    type: 'tel',
    placeholder: '10 dígitos',
    match: (l) => /tel[eé]fono|telefono|celular|whatsapp/.test(l),
  },
  {
    key: 'fecha_nacimiento',
    label: 'Fecha de nacimiento',
    type: 'date',
    match: (l) => /nacimiento/.test(l),
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'text',
    placeholder: 'Entidad federativa',
    match: (l) => /\bestado\b/.test(l) && !/civil/.test(l),
  },
  {
    key: 'domicilio',
    label: 'Domicilio',
    type: 'text',
    placeholder: 'Calle, número, colonia',
    match: (l) => /domicilio|direccion/.test(l),
  },
  {
    key: 'codigo_postal',
    label: 'Código postal',
    type: 'text',
    placeholder: '5 dígitos',
    match: (l) => /codigo postal|\bc\.?p\.?\b/.test(l),
  },
  {
    key: 'nss',
    label: 'Número de Seguro Social (NSS)',
    type: 'text',
    placeholder: '11 dígitos',
    match: (l) => /\bnss\b|seguro social/.test(l),
  },
  {
    key: 'ine',
    label: 'Clave de elector (INE)',
    type: 'text',
    placeholder: 'Clave de tu credencial',
    match: (l) => /\bine\b/.test(l),
  },
]

/** Nombre completo derivado: usa nombre_completo si existe, o nombre + apellidos. */
export function nombreCompleto(datos?: Record<string, string>): string {
  if (!datos) return ''
  if (datos.nombre_completo?.trim()) return datos.nombre_completo.trim()
  return [datos.nombre, datos.apellidos]
    .filter((s) => s?.trim())
    .map((s) => s.trim())
    .join(' ')
}

/**
 * Dada la lista de campos de un trámite y los datos personales guardados,
 * devuelve los valores iniciales autollenados y el set de campos rellenados.
 */
export function autollenar(
  campos: string[],
  datosPersonales: Record<string, string> | undefined,
): { valores: Record<string, string>; autollenados: Set<string> } {
  const valores: Record<string, string> = {}
  const autollenados = new Set<string>()
  if (!datosPersonales) return { valores, autollenados }

  const completo = nombreCompleto(datosPersonales)

  for (const campo of campos) {
    const l = norm(campo)
    let valor: string | undefined

    if (/apellido/.test(l) && !/nombre/.test(l)) {
      valor = datosPersonales.apellidos
    } else if (/nombre/.test(l)) {
      // "Nombre completo", "nombre del titular", "nombre y apellidos" → completo
      valor = completo || datosPersonales.nombre
    } else {
      const cp = CAMPOS_PERFIL.find(
        (c) => c.key !== 'nombre' && c.key !== 'apellidos' && c.match(l),
      )
      if (cp) valor = datosPersonales[cp.key]
    }

    if (valor?.trim()) {
      valores[campo] = valor
      autollenados.add(campo)
    }
  }
  return { valores, autollenados }
}

/** Cuántos de los datos del perfil están completos (para mostrar progreso). */
export function perfilCompletitud(datos: Record<string, string> | undefined): {
  llenos: number
  total: number
} {
  const total = CAMPOS_PERFIL.length
  if (!datos) return { llenos: 0, total }
  const llenos = CAMPOS_PERFIL.filter((c) => datos[c.key]?.trim()).length
  return { llenos, total }
}

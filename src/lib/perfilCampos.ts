// ============================================================================
// Registro de "datos personales" canónicos del cliente.
// Sirve para (1) construir el formulario de "Mi perfil" y (2) autollenar los
// formularios dinámicos de los trámites: cada campo del trámite se compara
// contra estos matchers y, si coincide y el perfil tiene el dato, se rellena.
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
    key: 'nombre_completo',
    label: 'Nombre completo',
    type: 'text',
    placeholder: 'Como aparece en tu identificación',
    match: (l) => /nombre/.test(l),
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
    // "estado" pero no "estado civil"
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

  for (const campo of campos) {
    const l = norm(campo)
    const cp = CAMPOS_PERFIL.find((c) => c.match(l))
    if (cp && datosPersonales[cp.key]?.trim()) {
      valores[campo] = datosPersonales[cp.key]
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

// Lee catalogo_tramites.csv y genera un UPDATE ... FROM (VALUES ...) para
// poblar los campos enriquecidos del catálogo, emparejando por nombre.
// Uso: node scripts/gen-catalogo-sql.mjs <ruta_csv>
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const csvPath = process.argv[2] || 'C:\\Users\\Sergi\\Desktop\\catalogo_tramites.csv'
const text = readFileSync(csvPath, 'utf8')

// --- Parser CSV (maneja campos entre comillas con comas y comillas escapadas) ---
function parseCSV(input) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c === '\r') {
      // ignora
    } else field += c
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

const rows = parseCSV(text).filter((r) => r.length > 1 && r.some((c) => c.trim()))
const header = rows.shift()

const sql = (s) => "'" + String(s).replace(/'/g, "''") + "'"
const num = (s) => {
  const n = Number(String(s).trim())
  return Number.isFinite(n) ? n : 0
}

const tuples = rows.map((r) => {
  const [
    categoria,
    nombre,
    datos_requeridos,
    prerequisitos_reales,
    ambito,
    nivel_automatizacion,
    que_se_automatiza,
    que_queda_manual,
    validaciones_requeridas,
    requiere_credenciales_cliente,
    precio_publico,
    precio_mayorista,
  ] = r
  return (
    '  (' +
    [
      sql(categoria),
      sql(nombre),
      sql(datos_requeridos),
      sql(prerequisitos_reales),
      sql(ambito),
      sql(nivel_automatizacion),
      sql(que_se_automatiza),
      sql(que_queda_manual),
      sql(validaciones_requeridas),
      sql(requiere_credenciales_cliente),
      num(precio_publico),
      num(precio_mayorista),
    ].join(', ') +
    ')'
  )
})

const out = `-- Generado desde catalogo_tramites.csv (no editar a mano).
update public.tramites t set
  categoria = v.categoria,
  datos_requeridos = v.datos_requeridos,
  prerequisitos_reales = v.prerequisitos_reales,
  ambito = v.ambito,
  nivel_automatizacion = v.nivel_automatizacion,
  que_se_automatiza = v.que_se_automatiza,
  que_queda_manual = v.que_queda_manual,
  validaciones_requeridas = v.validaciones_requeridas,
  requiere_credenciales_cliente = v.requiere_credenciales_cliente,
  precio_publico = v.precio_publico,
  precio_mayorista = v.precio_mayorista
from (values
${tuples.join(',\n')}
) as v(categoria, nombre, datos_requeridos, prerequisitos_reales, ambito,
       nivel_automatizacion, que_se_automatiza, que_queda_manual,
       validaciones_requeridas, requiere_credenciales_cliente,
       precio_publico, precio_mayorista)
where t.nombre = v.nombre;
`

const outPath = path.resolve(__dirname, '../supabase/seed_catalogo.sql')
writeFileSync(outPath, out, 'utf8')
console.log(`Filas: ${rows.length} · header cols: ${header.length}`)
console.log('Escrito:', outPath, `(${out.length} chars)`)

// Genera los íconos PNG de la PWA a partir de SVGs en memoria.
// Uso: node scripts/gen-icons.mjs   (requiere `sharp`)
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../public/icons')
await mkdir(outDir, { recursive: true })

// Logo con padding (para iconos normales: documento + check sobre fondo teal).
const logo = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="14" fill="#0f766e"/>
  <path d="M20 14h16l10 10v26a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z" fill="#ffffff"/>
  <path d="M36 14v8a2 2 0 0 0 2 2h8z" fill="#99f6e4"/>
  <path d="M23 44l5 5 11-13" fill="none" stroke="#0f766e" stroke-width="4"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

// Versión maskable: fondo a sangre completa y logo dentro de la safe-zone (~62%).
const maskable = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" fill="#0f766e"/>
  <g transform="translate(14 14) scale(0.56)">
    <path d="M20 14h16l10 10v26a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z" fill="#ffffff"/>
    <path d="M36 14v8a2 2 0 0 0 2 2h8z" fill="#99f6e4"/>
    <path d="M23 44l5 5 11-13" fill="none" stroke="#0f766e" stroke-width="4"
          stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`

const targets = [
  { name: 'pwa-192x192.png', size: 192, svg: logo },
  { name: 'pwa-512x512.png', size: 512, svg: logo },
  { name: 'apple-touch-icon.png', size: 180, svg: logo },
  { name: 'pwa-maskable-512x512.png', size: 512, svg: maskable },
]

for (const t of targets) {
  await sharp(Buffer.from(t.svg(t.size)))
    .resize(t.size, t.size)
    .png()
    .toFile(path.join(outDir, t.name))
  console.log('✓', t.name)
}
console.log('Íconos generados en public/icons/')

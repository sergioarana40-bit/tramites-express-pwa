import type { ReactNode } from 'react'

/** Logo en blanco con check dorado, para fondos oscuros. */
function LogoBlanco({ size = 46 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className="block">
      <rect width="64" height="64" rx="16" fill="rgba(255,255,255,.10)" />
      <path d="M20 14h16l10 10v26a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z" fill="#ffffff" />
      <path d="M36 14v8a2 2 0 0 0 2 2h8z" fill="#9FB4D8" />
      <path
        d="M23 44l5 5 11-13"
        fill="none"
        stroke="#b5852a"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Marco compartido por login y registro: hero navy + tarjeta sobrepuesta. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        {/* Hero navy */}
        <div
          className="relative overflow-hidden px-7 pb-16 pt-16 text-white"
          style={{ background: 'linear-gradient(160deg,#1A3057 0%,#13243B 70%)' }}
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute right-3 top-8 h-28 w-28 rounded-full border border-white/[0.06]" />
          <LogoBlanco />
          <h1 className="mt-5 font-display text-3xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-white/70">{subtitle}</p>}
        </div>

        {/* Tarjeta del formulario, sobrepuesta al hero */}
        <div className="relative z-10 -mt-10 flex-1 px-5 pb-8">
          <div className="card p-6 shadow-lift">{children}</div>
          <p className="mt-5 text-center text-xs text-mut">Trámites Express · Gestoría digital</p>
        </div>
      </div>
    </div>
  )
}
